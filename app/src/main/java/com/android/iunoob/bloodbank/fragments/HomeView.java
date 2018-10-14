package com.android.iunoob.bloodbank.fragments;

import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ListView;
import android.widget.RelativeLayout;

import com.android.iunoob.bloodbank.R;
import com.android.iunoob.bloodbank.adapters.RecentDonorAdapter;
import com.android.iunoob.bloodbank.viewmodels.CustomUserData;

import java.util.ArrayList;
import java.util.List;

/***
 Project Name: BloodBank
 Project Date: 10/12/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class HomeView extends Fragment {

    ListView donorsList;
    ListView reqstList;

    List<CustomUserData> donorList;

    private Button btndonor, btnreqst;
    private RelativeLayout layout_donor, layout_reqst;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        View view = inflater.inflate(R.layout.home_view_fragment, container, false);
        donorsList = view.findViewById(R.id.donorsList);
        donorList = new ArrayList<>();

        btndonor = view.findViewById(R.id.btndonors);
        btnreqst = view.findViewById(R.id.btnbloodreqst);

        layout_donor = view.findViewById(R.id.donorsLayout);
        layout_reqst = view.findViewById(R.id.reqstLayout);

        btndonor.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                layout_donor.setVisibility(View.VISIBLE);
                layout_reqst.setVisibility(View.GONE);
                btndonor.setTextColor(getActivity().getResources().getColor(android.R.color.widget_edittext_dark));
                btnreqst.setTextColor(getActivity().getResources().getColor(R.color.colorPrimary));
                btndonor.setBackgroundColor(getActivity().getResources().getColor(R.color.primary_dark));
                btnreqst.setBackgroundColor(getActivity().getResources().getColor(android.R.color.white));

            }
        });

        btnreqst.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                layout_donor.setVisibility(View.GONE);
                layout_reqst.setVisibility(View.VISIBLE);
                btnreqst.setTextColor(getResources().getColor(android.R.color.widget_edittext_dark));
                btndonor.setTextColor(getResources().getColor(R.color.colorPrimary));
                btnreqst.setBackgroundColor(getResources().getColor(R.color.primary_dark));
                btndonor.setBackgroundColor(getResources().getColor(android.R.color.white));
            }
        });

        UserList();

        RecentDonorAdapter adapter = new RecentDonorAdapter(getActivity(), donorList);

        donorsList.setAdapter(adapter);

        return view;

    }
    public void UserList()
    {
        donorList.add(new CustomUserData("Shamim Hossian", "B+", "Donated: 121 day ago"));
        donorList.add(new CustomUserData("Mobarak Hossian", "AB+", "Donated: 31 day ago"));
        donorList.add(new CustomUserData("Mehedi Hossian", "A+", "Donated: 1 day ago"));
        donorList.add(new CustomUserData("Akib Hossian", "AB-", "Donated: 5 day ago"));
        donorList.add(new CustomUserData("Karim Hossian", "O+", "Donated: 87 day ago"));
        donorList.add(new CustomUserData("Babul Hossian", "A-", "Donated: 1 day ago"));
        donorList.add(new CustomUserData("Abul Hossian", "B+", "Donated: 10 day ago"));
        donorList.add(new CustomUserData("Lablu Hossian", "O-", "Donated: 1 day ago"));
        donorList.add(new CustomUserData("Bablu Hossian", "B+", "Donated: 1 day ago"));
        donorList.add(new CustomUserData("Hablu Hossian", "A+", "Donated: 13 day ago"));

    }

    @Override
    public void onStart() {
        super.onStart();
    }

    @Override
    public void onResume() {
        super.onResume();
    }

    @Override
    public void onStop() {
        super.onStop();
    }

    @Override
    public void onPause() {
        super.onPause();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }
}
