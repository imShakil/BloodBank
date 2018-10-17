package com.android.iunoob.bloodbank.fragments;

import android.app.ProgressDialog;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v7.widget.DefaultItemAnimator;
import android.support.v7.widget.DividerItemDecoration;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import com.android.iunoob.bloodbank.R;
import com.android.iunoob.bloodbank.adapters.BloodRequestAdapter;
import com.android.iunoob.bloodbank.viewmodels.CustomUserData;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;


import java.util.ArrayList;
import java.util.List;


/***
 Project Name: BloodBank
 Project Date: 10/12/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class HomeView extends Fragment {

    private View view;
    private RecyclerView recentPosts;

    private DatabaseReference donor_ref;
    FirebaseAuth mAuth;
    private BloodRequestAdapter restAdapter;
    private List<CustomUserData> postLists;
    private ProgressDialog pd;

    public HomeView() {

    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        view = inflater.inflate(R.layout.home_view_fragment, container, false);
        recentPosts = (RecyclerView) view.findViewById(R.id.recyleposts);

        recentPosts.setLayoutManager(new LinearLayoutManager(getContext()));

        donor_ref = FirebaseDatabase.getInstance().getReference();
        postLists = new ArrayList<>();

        pd = new ProgressDialog(getActivity());
        pd.setMessage("Loading...");
        pd.setCancelable(true);
        pd.setCanceledOnTouchOutside(false);

        mAuth = FirebaseAuth.getInstance();
        getActivity().setTitle("Blood Point");

        restAdapter = new BloodRequestAdapter(postLists);
        RecyclerView.LayoutManager pmLayout = new LinearLayoutManager(getContext());
        recentPosts.setLayoutManager(pmLayout);
        recentPosts.setItemAnimator(new DefaultItemAnimator());
        recentPosts.addItemDecoration(new DividerItemDecoration(getActivity(), LinearLayoutManager.VERTICAL));
        recentPosts.setAdapter(restAdapter);

        AddPosts();
        return view;

    }
    private void AddPosts()
    {
        Query allposts = donor_ref.child("posts");
        pd.show();
        allposts.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {

                if(dataSnapshot.exists()) {

                    for (DataSnapshot singlepost : dataSnapshot.getChildren()) {
                        CustomUserData customUserData = singlepost.getValue(CustomUserData.class);
                        postLists.add(customUserData);
                        restAdapter.notifyDataSetChanged();
                    }
                    pd.dismiss();
                }
                else
                {
                    Toast.makeText(getActivity(), "Database is empty now!",
                            Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {

                Log.d("User", databaseError.getMessage());

            }
        });

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
