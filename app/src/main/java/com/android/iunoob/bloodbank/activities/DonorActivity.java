package com.android.iunoob.bloodbank.activities;

import android.app.DatePickerDialog;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.Spinner;

import com.android.iunoob.bloodbank.R;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.text.SimpleDateFormat;
import java.util.Calendar;

public class DonorActivity extends AppCompatActivity {

    private EditText contact, states;
    private Spinner division, blood;
    private int day, month, year;
    private Calendar calendar;
    private Button btnsubmit, btndate;

    DatabaseReference db_ref;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_donor);

        contact = findViewById(R.id.userMobile);
        states = findViewById(R.id.userStates);
        btnsubmit = findViewById(R.id.btnsubmit);
        btndate = findViewById(R.id.donatedate);

        db_ref = FirebaseDatabase.getInstance().getReference("donors");
        calendar = Calendar.getInstance();
        day = calendar.get(Calendar.DAY_OF_MONTH);
        month = calendar.get(Calendar.MONTH);
        year = calendar.get(Calendar.YEAR);

       findViewById(R.id.btnsubmit).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                AddDonor();
            }
        });

    }

    private void AddDonor() {

        final String contactno = contact.getText().toString();
        final String location = states.getText().toString();
        final String LastDonateDate = btndate.getText().toString();
        

    }

    public void SelectDate(View view) {
        DatePickerDialog datePickerDialog = new DatePickerDialog(this, dateSetListener, year, month, day);
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
