package com.android.iunoob.bloodbank.fragments;

import android.app.DatePickerDialog;
import android.app.ProgressDialog;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.RelativeLayout;
import android.widget.Spinner;

import com.android.iunoob.bloodbank.R;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import java.text.SimpleDateFormat;
import java.util.Calendar;

/***
 Project Name: BloodBank
 Project Date: 10/12/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class AchievmentsView extends Fragment {

    private EditText contact, states;
    private Spinner division, blood;
    private int day, month, year;
    private Calendar calendar;
    private Button btnsubmit, btndate;
    private ProgressDialog pd;

    RelativeLayout viewAchievlayout;
    RelativeLayout AddDonorLayout;

    DatabaseReference db_ref;
    FirebaseAuth mAuth;

    View view;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        view = inflater.inflate(R.layout.user_achievment_fragment, container, false);

        pd = new ProgressDialog(getActivity());
        pd.setMessage("Loading...");
        pd.setCancelable(true);
        pd.setCanceledOnTouchOutside(false);

        contact = view.findViewById(R.id.userMobile);
        states = view.findViewById(R.id.userStates);
        btnsubmit = view.findViewById(R.id.btnsubmit);
        btndate = view.findViewById(R.id.donatedate);

        AddDonorLayout =  view.findViewById(R.id.btnAddDonor);
        viewAchievlayout =  view.findViewById(R.id.btnViewAchievment);

        db_ref = FirebaseDatabase.getInstance().getReference("donors");

        Query singleQ = db_ref.child(mAuth.getInstance().getCurrentUser().getUid());

        try {
            pd.show();
            singleQ.addListenerForSingleValueEvent(new ValueEventListener() {

                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {

                    if(dataSnapshot.exists()) {

                        AddDonorLayout.setVisibility(View.GONE);
                        viewAchievlayout.setVisibility(View.VISIBLE);
                        ShowAchievments(dataSnapshot);
                        //Toast.makeText(getApplicationContext(), pd, Toast.LENGTH_LONG)
                        //   .show();
                    }
                    else
                    {
                        AddDonorLayout.setVisibility(View.VISIBLE);
                        viewAchievlayout.setVisibility(View.GONE);
                    }
                    pd.dismiss();
                }

                @Override
                public void onCancelled(@NonNull DatabaseError databaseError) {

                }

            });


        } catch (Exception e)
        {
            e.printStackTrace();
        }

        calendar = Calendar.getInstance();
        day = calendar.get(Calendar.DAY_OF_MONTH);
        month = calendar.get(Calendar.MONTH);
        year = calendar.get(Calendar.YEAR);

        view.findViewById(R.id.btnsubmit).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                AddDonor();
            }
        });

        return view;
    }

    private void ShowAchievments(DataSnapshot dataSnapshot) {



    }

    private void AddDonor() {

        final String contactno = contact.getText().toString();
        final String location = states.getText().toString();
        final String LastDonateDate = btndate.getText().toString();

    }

    public void SelectDate(View view) {
        DatePickerDialog datePickerDialog = new DatePickerDialog(getActivity(), dateSetListener, year, month, day);
        datePickerDialog.show();
    }

    DatePickerDialog.OnDateSetListener dateSetListener = new DatePickerDialog.OnDateSetListener() {

        @Override
        public void onDateSet(DatePicker datePicker, int year, int month, int day) {
            calendar.set(year, month, day);
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy");
            btndate.setText(dateFormat.format(calendar.getTime()));
        }
    };
}
