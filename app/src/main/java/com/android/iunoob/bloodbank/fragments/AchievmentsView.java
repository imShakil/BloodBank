package com.android.iunoob.bloodbank.fragments;

import android.app.DatePickerDialog;
import android.app.ProgressDialog;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.RelativeLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.android.iunoob.bloodbank.R;
import com.android.iunoob.bloodbank.activities.Dashboard;
import com.android.iunoob.bloodbank.activities.ProfileActivity;
import com.android.iunoob.bloodbank.viewmodels.DonorData;
import com.android.iunoob.bloodbank.viewmodels.UserData;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.TimeZone;

/***
 Project Name: BloodBank
 Project Date: 10/12/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class AchievmentsView extends Fragment {

    private int day, month, year;
    private Calendar calendar;
    private ProgressDialog pd;
    DatabaseReference db_ref, user_ref;
    FirebaseAuth mAuth;

    private TextView totalDonate, lastDonate;

    private String[] bloodgroup, divisionlist;

    private View view;

    public AchievmentsView() {

    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        view = inflater.inflate(R.layout.user_achievment_fragment, container, false);

        pd = new ProgressDialog(getActivity());
        pd.setMessage("Loading...");
        pd.setCancelable(true);
        pd.setCanceledOnTouchOutside(false);
        bloodgroup = getResources().getStringArray(R.array.Blood_Group);
        divisionlist = getResources().getStringArray(R.array.division_list);
        lastDonate = view.findViewById(R.id.setLastDonate);
        totalDonate = view.findViewById(R.id.settotalDonate);

        getActivity().setTitle("Achievements");
        mAuth  = FirebaseAuth.getInstance();


        db_ref = FirebaseDatabase.getInstance().getReference("donors");
        user_ref = FirebaseDatabase.getInstance().getReference("users");

        Query userQ = user_ref.child(mAuth.getCurrentUser().getUid());

        try {
            pd.show();
            userQ.addListenerForSingleValueEvent(new ValueEventListener() {

                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {

                    if(dataSnapshot.exists())
                    {
                        final UserData userData = dataSnapshot.getValue(UserData.class);
                        final int getdiv = userData.getDivision();
                        final int getbg = userData.getBloodGroup();
                        Query donorQ = db_ref.child(divisionlist[getdiv].toString())
                                .child(bloodgroup[getbg].toString())
                                .child(mAuth.getCurrentUser().getUid());

                        donorQ.addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                                if(dataSnapshot.exists())
                                {
                                    DonorData donorData = dataSnapshot.getValue(DonorData.class);
                                    totalDonate.setText(donorData.getTotalDonate()+" times");
                                    if(donorData.getTotalDonate() == 0)
                                        lastDonate.setText("Do not donate yet!");
                                    else lastDonate.setText(donorData.getLastDonate());

                                }
                                else
                                {
                                    /*Toast.makeText(getActivity(), "You are not a user."+getdiv+getbg+" "+" "+divisionlist[getdiv]+" "+bloodgroup[getbg], Toast.LENGTH_LONG)
                                            .show();*/
                                    Toast.makeText(getActivity(), "Update your profile to be a donor first.", Toast.LENGTH_LONG)
                                            .show();
                                    startActivity(new Intent(getActivity(), Dashboard.class));
                                }
                                pd.dismiss();
                            }

                            @Override
                            public void onCancelled(@NonNull DatabaseError databaseError) {

                            }
                        });


                    }
                    else
                    {
                        Toast.makeText(getActivity(), "You are not a user."+divisionlist[0]+" "+bloodgroup[0], Toast.LENGTH_LONG)
                                .show();
                    }

                }

                @Override
                public void onCancelled(@NonNull DatabaseError databaseError) {

                    Log.d("User", databaseError.getMessage());
                }

            });


        } catch (Exception e)
        {
            e.printStackTrace();
        }

        calendar = Calendar.getInstance(TimeZone.getDefault());
        day = calendar.get(Calendar.DAY_OF_MONTH);
        month = calendar.get(Calendar.MONTH);
        year = calendar.get(Calendar.YEAR);


        return view;
    }

    private void ShowAchievments(DataSnapshot dataSnapshot) {



    }

}
