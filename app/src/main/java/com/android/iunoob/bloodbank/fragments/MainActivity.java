package com.android.iunoob.bloodbank.fragments;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.support.v4.app.Fragment;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ListView;
import android.widget.RelativeLayout;

import com.android.iunoob.bloodbank.R;
import com.android.iunoob.bloodbank.adapters.RecentDonorAdapter;
import com.android.iunoob.bloodbank.viewmodels.CustomUserData;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    ListView donorsList;
    ListView reqstList;
    
    Button btndonor, btnreqst;
    RelativeLayout layout_donor, layout_reqst;

    List<CustomUserData> donorList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        donorsList = findViewById(R.id.donorsList);
        donorList = new ArrayList<>();
        
        btndonor = findViewById(R.id.btndonors);
        btnreqst = findViewById(R.id.btnbloodreqst);

        layout_donor = findViewById(R.id.donorsLayout);
        layout_reqst = findViewById(R.id.reqstLayout);

        btndonor.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                layout_donor.setVisibility(View.VISIBLE);
                layout_reqst.setVisibility(View.GONE);
                btndonor.setTextColor(getApplication().getResources().getColor(android.R.color.widget_edittext_dark));
                btnreqst.setTextColor(getApplication().getResources().getColor(R.color.colorPrimary));
                btndonor.setBackgroundColor(getApplication().getResources().getColor(R.color.primary_dark));
                btnreqst.setBackgroundColor(getApplication().getResources().getColor(android.R.color.white));

            }
        });

        btnreqst.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                layout_donor.setVisibility(View.GONE);
                layout_reqst.setVisibility(View.VISIBLE);
                btnreqst.setTextColor(getApplication().getResources().getColor(android.R.color.widget_edittext_dark));
                btndonor.setTextColor(getApplication().getResources().getColor(R.color.colorPrimary));
                btnreqst.setBackgroundColor(getApplication().getResources().getColor(R.color.primary_dark));
                btndonor.setBackgroundColor(getApplication().getResources().getColor(android.R.color.white));
            }
        });

        UserList();

        RecentDonorAdapter adapter = new RecentDonorAdapter(getApplicationContext(), donorList);

       donorsList.setAdapter(adapter);

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
}
