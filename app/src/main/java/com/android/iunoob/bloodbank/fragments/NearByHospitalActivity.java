package com.android.iunoob.bloodbank.fragments;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.os.Bundle;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.Toast;

import com.android.iunoob.bloodbank.R;
import com.android.iunoob.bloodbank.viewmodels.GetNearbyPlacesData;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;

import java.io.IOException;
import java.util.List;

/***
 Project Name: BloodBank
 Project Date: 10/22/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class NearByHospitalActivity extends Fragment implements
        OnMapReadyCallback, GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener, LocationListener {

    private GoogleMap mMap;
    View view;
    private GoogleApiClient client;
    private LocationRequest locationRequest;
    Location lastlocation;
    private Marker currentLocationmMarker = null;
    private static final int Permission_Request = 99;
    int PROXIMITY_RADIUS = 10000;
    double latitude, longitude;
    private FusedLocationProviderClient fusedLocationProviderClient;


    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        view = inflater.inflate(R.layout.near_by_hospitals, container, false);
        getActivity().setTitle("Nearest hospitals");

        return view;
    }

    @Override
    public void onViewCreated(@NonNull final View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        fusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(getActivity());

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            checkLocationPermission();
            if(checkLocationPermission())
            {
                fusedLocationProviderClient.getLastLocation().addOnSuccessListener(getActivity(), new OnSuccessListener<Location>() {
                    @Override
                    public void onSuccess(Location location) {
                        onLocationChanged(location);
                        Object dataTransfer[] = new Object[2];
                        GetNearbyPlacesData getNearbyPlacesData = new GetNearbyPlacesData();
                        String hospital = "hospital";
                        String url = getUrl(location.getLatitude(), location.getLongitude(), hospital);
                        dataTransfer[0] = mMap;
                        dataTransfer[1] = url;
                        getNearbyPlacesData.execute(dataTransfer);
                        Toast.makeText(getActivity(), "Showing Nearby Hospitals" + url, Toast.LENGTH_SHORT).show();

                    }

                });
            }
        }

        SupportMapFragment mapFragment = (SupportMapFragment) getChildFragmentManager().findFragmentById(R.id.gMap);
        if (mapFragment != null) {
            mapFragment.getMapAsync(this);
        }
        else
        {
            Toast.makeText(getActivity(), "MapFragment is null, why?", Toast.LENGTH_LONG).show();
        }

    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        switch (requestCode) {
            case Permission_Request:
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    if (ContextCompat.checkSelfPermission(getActivity(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                        if (client == null) {
                            buildGoogleApiClient();
                        }
                        mMap.setMyLocationEnabled(true);
                        mMap.setTrafficEnabled(true);
                    }
                } else {
                    Toast.makeText(getActivity(), "Permission Denied", Toast.LENGTH_LONG).show();
                }
        }
    }


    @Override
    public void onMapReady(GoogleMap googleMap) {

        mMap = googleMap;

        if (ContextCompat.checkSelfPermission(getActivity(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            buildGoogleApiClient();
            mMap.setMyLocationEnabled(true);
            mMap.setTrafficEnabled(true);
        }

    }

    protected synchronized void buildGoogleApiClient() {
        client = new GoogleApiClient.Builder(getActivity().getApplicationContext()).addConnectionCallbacks(this).addOnConnectionFailedListener(this).addApi(LocationServices.API).build();
        client.connect();

    }

    @Override
    public void onConnected(@Nullable Bundle bundle) {

        locationRequest = new LocationRequest();
        locationRequest.setInterval(1000);
        locationRequest.setFastestInterval(1000);
        locationRequest.setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY);

        if (ActivityCompat.checkSelfPermission(getActivity(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(getActivity(), Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
           fusedLocationProviderClient.requestLocationUpdates(locationRequest, mLocationCallback, Looper.myLooper());
        }
    }

    private String getUrl(double latitude, double longitude, String nearbyPlace) {

        StringBuilder googlePlaceUrl = new StringBuilder("https://maps.googleapis.com/maps/api/place/nearbysearch/json?");
        googlePlaceUrl.append("location=").append(latitude).append(",").append(longitude);
        googlePlaceUrl.append("&radius=").append(PROXIMITY_RADIUS);
        googlePlaceUrl.append("&type=").append(nearbyPlace);
        googlePlaceUrl.append("&sensor=true");
        googlePlaceUrl.append("&key=" + "AIzaSyAmeQ8IwQWBcmFLRpKARu7LM1TlShQKmfg");

        Log.d("NearbyHospitalActivity", "url = " + googlePlaceUrl.toString());

        return googlePlaceUrl.toString();
    }


    public boolean checkLocationPermission() {
        if (ContextCompat.checkSelfPermission(getActivity(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            if (ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.ACCESS_FINE_LOCATION)) {
                ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, Permission_Request);
            } else {
                ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, Permission_Request);
            }
            return false;

        } else
            return true;
    }

    @Override
    public void onConnectionSuspended(int i) {

    }

    @Override
    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {

    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        mMap.clear();
    }

    @Override
    public void onLocationChanged(Location location) {
        latitude = location.getLatitude();
        longitude = location.getLongitude();
        lastlocation = location;
        if (currentLocationmMarker != null) {
            currentLocationmMarker.remove();

        }
        Log.v("Current Location", "IN ON LOCATION CHANGE, lat=" + latitude + ", lon=" + longitude);
        LatLng latLng = new LatLng(location.getLatitude(), location.getLongitude());
        MarkerOptions markerOptions = new MarkerOptions();
        markerOptions.position(latLng);
        markerOptions.title("Current Location");
        markerOptions.icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_BLUE));
        currentLocationmMarker = mMap.addMarker(markerOptions);
        mMap.moveCamera(CameraUpdateFactory.newLatLng(latLng));
        mMap.animateCamera(CameraUpdateFactory.zoomBy(10));

        Object dataTransfer[] = new Object[2];
        GetNearbyPlacesData getNearbyPlacesData = new GetNearbyPlacesData();
        String hospital = "hospital";
        String url = getUrl(location.getLatitude(), location.getLongitude(), hospital);
        dataTransfer[0] = mMap;
        dataTransfer[1] = url;
        getNearbyPlacesData.execute(dataTransfer);
        Toast.makeText(getActivity(), "Showing Nearby Hospitals" + url, Toast.LENGTH_SHORT).show();


        if (client != null) {
            fusedLocationProviderClient.removeLocationUpdates(mLocationCallback);
        }
    }

    LocationCallback mLocationCallback = new LocationCallback() {
        @Override
        public void onLocationResult(LocationResult locationResult) {
            for (Location location : locationResult.getLocations()) {
                Log.i("MainActivity", "Location: " + location.getLatitude() + " " + location.getLongitude());

            }
        }
    };


}
