package com.android.iunoob.bloodbank.fragments;

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
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.android.iunoob.bloodbank.R;
import com.android.iunoob.bloodbank.activities.Dashboard;
import com.android.iunoob.bloodbank.viewmodels.DonorData;
import com.android.iunoob.bloodbank.viewmodels.UserData;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import java.util.Calendar;
import java.util.TimeZone;

/***
 Project Name: BloodBank
 Project Date: 10/12/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class AchievmentsView extends Fragment {

    private int cur_day, cur_month, cur_year, day, month, year, totday;
    private Calendar calendar;
    private ProgressDialog pd;
    DatabaseReference db_ref, user_ref;
    FirebaseAuth mAuth;

    private TextView totalDonate, lastDonate, nextDonate, donateInfo;

    private String[] bloodgroup, divisionlist;
    private String lastDate;

    private View view;
    private Button yes;
    private LinearLayout yesno;

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
        donateInfo = view.findViewById(R.id.donateInfo);

        getActivity().setTitle("Achievements");
        mAuth  = FirebaseAuth.getInstance();
        lastDate = "";


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
                        final Query donorQ = db_ref.child(divisionlist[getdiv])
                                .child(bloodgroup[getbg])
                                .child(mAuth.getCurrentUser().getUid());

                        donorQ.addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(@NonNull final DataSnapshot dataSnapshot) {
                                if(dataSnapshot.exists())
                                {
                                    final DonorData donorData = dataSnapshot.getValue(DonorData.class);
                                    totalDonate.setText(donorData.getTotalDonate()+" times");
                                    if(donorData.getTotalDonate() == 0) {
                                        lastDate = "01/01/2001";
                                        lastDonate.setText("Do not donate yet!");
                                    }
                                    else {
                                        lastDate = donorData.getLastDonate();
                                        lastDonate.setText(donorData.getLastDonate());
                                    }

                                    totday = 0;
                                    nextDonate = view.findViewById(R.id.nextDonate);
                                    yesno = view.findViewById(R.id.yesnolayout);
                                    if(lastDate.length() != 0) {

                                        int cnt = 0;
                                        int tot = 0;
                                        for (int i = 0; i < lastDate.length(); i++) {
                                            if (cnt == 0 && lastDate.charAt(i) == '/') {
                                                day = tot;
                                                tot=0;
                                                cnt+=1;

                                            } else if (cnt == 1 && lastDate.charAt(i) == '/') {
                                                cnt+=1;
                                                month = tot;
                                                tot=0;

                                            } else tot = tot * 10 + (lastDate.charAt(i) - '0');
                                        }
                                        year = tot;
                                        calendar = Calendar.getInstance(TimeZone.getDefault());
                                        cur_day = calendar.get(Calendar.DAY_OF_MONTH);
                                        cur_month = calendar.get(Calendar.MONTH)+1;
                                        cur_year = calendar.get(Calendar.YEAR);

                                        if(day>cur_day) {
                                            cur_day += 30;
                                            cur_month -= 1;
                                        }
                                        totday += (cur_day - day);

                                        if(month>cur_month)
                                        {
                                            cur_month+=12;
                                            cur_year -=1;
                                        }
                                        totday += ((cur_month - month)*30);

                                        totday += ((cur_year - year)*365);

                                        try
                                        {
                                            if(totday>120)
                                            {
                                                donateInfo.setText("Have you donated today?");
                                                nextDonate.setVisibility(View.GONE);
                                                yesno.setVisibility(View.VISIBLE);

                                                yes = view.findViewById(R.id.btnYes);
                                               cur_day = calendar.get(Calendar.DAY_OF_MONTH);
                                               cur_month = calendar.get(Calendar.MONTH)+1;
                                               cur_year = calendar.get(Calendar.YEAR);

                                                yes.setOnClickListener(new View.OnClickListener() {
                                                    @Override
                                                    public void onClick(View v) {
                                                        db_ref.child(divisionlist[getdiv])
                                                                .child(bloodgroup[getbg])
                                                                .child(mAuth.getCurrentUser().getUid())
                                                                .child("LastDonate").setValue(cur_day+"/"+cur_month+"/"+cur_year);
                                                        db_ref.child(divisionlist[getdiv])
                                                                .child(bloodgroup[getbg])
                                                                .child(mAuth.getCurrentUser().getUid())
                                                                .child("TotalDonate").setValue(donorData.getTotalDonate()+1);
                                                        startActivity(new Intent(getActivity(), Dashboard.class));
                                                    }
                                                });
                                            }
                                            else
                                            {
                                                donateInfo.setText("Next donation available in:");
                                                yesno.setVisibility(View.GONE);
                                                nextDonate.setVisibility(View.VISIBLE);
                                                nextDonate.setText((120-totday)+" days");
                                            }
                                        } catch (Exception e)
                                        {
                                            e.printStackTrace();
                                        }

                                    }



                                }
                                else
                                {
                                    LinearLayout linearLayout = view.findViewById(R.id.donorAchiev);
                                    linearLayout.setVisibility(View.GONE);
                                    TextView tv  = view.findViewById(R.id.ShowInof);
                                    tv.setVisibility(View.VISIBLE);
                                    Toast.makeText(getActivity(), "Update your profile to be a donor first.", Toast.LENGTH_LONG)
                                            .show();
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

        return view;
    }

}
