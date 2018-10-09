package com.android.iunoob.bloodbank;

import android.app.ProgressDialog;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;

public class SignupActivity extends AppCompatActivity {

    private EditText inputemail, inputpassword, retypePassword;
    private FirebaseAuth mAuth;
    private Button btnSignup, btnlogin;
    private ProgressDialog pd;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);

        pd = new ProgressDialog(this);
        pd.setMessage("Loading...");
        pd.setCancelable(true);
        pd.setCanceledOnTouchOutside(false);

        mAuth = FirebaseAuth.getInstance();

        if (mAuth.getCurrentUser() != null)
        {
            startActivity(new Intent(SignupActivity.this, Dashboard.class));
            finish();
        }

        inputemail = findViewById(R.id.input_username);
        inputpassword = findViewById(R.id.input_password);
        retypePassword = findViewById(R.id.input_password_confirm);

        btnSignup = findViewById(R.id.button_register);

        btnSignup.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                final String email = inputemail.getText().toString();
                final String password = inputpassword.getText().toString();
                final String ConfirmPassword = retypePassword.getText().toString();

                try
                {
                    if(password.compareTo(ConfirmPassword)!=0)
                    {
                        Toast.makeText(SignupActivity.this, "Password does not match!", Toast.LENGTH_LONG)
                                .show();
                        retypePassword.requestFocus();
                    }
                    else if (password.length()>0 && email.length()>0)
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
                                        }
                                        else
                                        {
                                            Intent intent = new Intent(SignupActivity.this, Dashboard.class);
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
}
