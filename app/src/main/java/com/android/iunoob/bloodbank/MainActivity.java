package com.android.iunoob.bloodbank;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.ListView;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    ListView donorsList;
    ListView reqstList;

    List<CustomUserList> donorList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        donorsList = findViewById(R.id.donorsList);
        donorList = new ArrayList<>();

        UserList();

        RecentDonorAdapter adapter = new RecentDonorAdapter(MainActivity.this, donorList);

        donorsList.setAdapter(adapter);

    }

    public void UserList()
    {
        donorList.add(new CustomUserList("Shamim Hossian", "B+", "Donated: 121 day ago"));
        donorList.add(new CustomUserList("Mobarak Hossian", "AB+", "Donated: 31 day ago"));
        donorList.add(new CustomUserList("Mehedi Hossian", "A+", "Donated: 1 day ago"));
        donorList.add(new CustomUserList("Akib Hossian", "AB-", "Donated: 5 day ago"));
        donorList.add(new CustomUserList("Karim Hossian", "O+", "Donated: 87 day ago"));
        donorList.add(new CustomUserList("Babul Hossian", "A-", "Donated: 1 day ago"));
        donorList.add(new CustomUserList("Abul Hossian", "B+", "Donated: 10 day ago"));
        donorList.add(new CustomUserList("Lablu Hossian", "O-", "Donated: 1 day ago"));
        donorList.add(new CustomUserList("Bablu Hossian", "B+", "Donated: 1 day ago"));
        donorList.add(new CustomUserList("Hablu Hossian", "A+", "Donated: 13 day ago"));

    }
}
