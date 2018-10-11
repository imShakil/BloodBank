package com.android.iunoob.bloodbank;

import android.app.DatePickerDialog;
import android.app.ProgressDialog;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.text.SimpleDateFormat;
import java.util.Calendar;

public class SignupActivity extends AppCompatActivity {

    private EditText inputemail, inputpassword, retypePassword, fullName;
    private FirebaseAuth mAuth;
    private Button btnSignup, btndate;
    private ProgressDialog pd;
    private Spinner gender;
    private Calendar calendar;
    private int year, month, day;

    private DatabaseReference db_ref;
    private FirebaseDatabase db_User;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);


        pd = new ProgressDialog(this);
        pd.setMessage("Loading...");
        pd.setCancelable(true);
        pd.setCanceledOnTouchOutside(false);

        mAuth = FirebaseAuth.getInstance();
        calendar = Calendar.getInstance();
        year = calendar.get(Calendar.YEAR);
        month = calendar.get(Calendar.MONTH);
        day = calendar.get(Calendar.DAY_OF_MONTH);

        if (mAuth.getCurrentUser() != null)
        {
            startActivity(new Intent(SignupActivity.this, Dashboard.class));
            finish();
        }

        db_User = FirebaseDatabase.getInstance();
        db_ref = db_User.getReference("users");

        inputemail = findViewById(R.id.input_username);
        inputpassword = findViewById(R.id.input_password);
        retypePassword = findViewById(R.id.input_password_confirm);
        fullName = findViewById(R.id.input_fullName);
        btndate = findViewById(R.id.datepicker);
        gender = findViewById(R.id.gender);

        btnSignup = findViewById(R.id.button_register);


        btnSignup.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                final String email = inputemail.getText().toString();
                final String password = inputpassword.getText().toString();
                final String ConfirmPassword = retypePassword.getText().toString();
                final String Name = fullName.getText().toString();
                final String Gender = gender.getSelectedItem().toString();
                final String bDate = btndate.getText().toString();

                try
                {
                    if(password.compareTo(ConfirmPassword)!=0)
                    {
                        Toast.makeText(SignupActivity.this, "Password does not match!", Toast.LENGTH_LONG)
                                .show();
                        retypePassword.requestFocus();
                    }
                    else if (password.length()>0 && email.length()>0 && Name.length()>0 && Gender.length()>0 && bDate.length()>0)
                    {
                        pd.show();

                        mAuth.createUserWithEmailAndPassword(email, password)
                                .addOnCompleteListener(SignupActivity.this, new OnCompleteListener<AuthResult>() {
                                    @Override
                                    public void onComplete(@NonNull Task<AuthResult> task) {

                                        if(!task.isSuccessful())
                                        {
                                            Toast.makeText(SignupActivity.this, "Registration failed! try agian.", Toast.LENGTH_LONG)
                                                    .show();
                                            Log.v("error", task.getException().getMessage());
                                            //inputpassword.setText(null);
                                           // retypePassword.setText(null);
                                        }
                                        else
                                        {
                                            String id = db_ref.push().getKey();

                                            //User user = new User(email, Name, Gender, bDate);
                                            db_ref.child(id).child("User ID").setValue(id);
                                            db_ref.child(id).child("User Name").setValue(Name);
                                            db_ref.child(id).child("User Gender").setValue(Gender);
                                            db_ref.child(id).child("User Birthdate").setValue(bDate);

                                            Toast.makeText(getApplicationContext(), "Your account has been created! Sign in Now.", Toast.LENGTH_LONG)
                                                    .show();
                                            mAuth.signOut();
                                            Intent intent = new Intent(SignupActivity.this, LoginActivity.class);
                                            startActivity(intent);
                                            finish();
                                        }
                                        pd.dismiss();
                                    }

                                });
                    }
                    else
                    {
                        Toast.makeText(SignupActivity.this, "Please fill all the field.", Toast.LENGTH_LONG)
                                .show();

                    }
                }
                catch (Exception e)
                {
                    e.printStackTrace();
                }
            }
        });


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
