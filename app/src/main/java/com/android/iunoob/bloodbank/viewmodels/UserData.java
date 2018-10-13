package com.android.iunoob.bloodbank.viewmodels;

/***
 Project Name: BloodBank
 Project Date: 10/12/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class UserData {

    private String Name;
    private String Email;
    private String Gender;
    private String Birthdate;

    public UserData() {

    }



    public String getName() {
        return Name;
    }

    public String getEmail() {
        return Email;
    }

    public String getGender() {
        return Gender;
    }

    public String getBirthdate() {
        return Birthdate;
    }

    public void setName(String name) {
        this.Name = name;
    }

    public void setEmail(String email) {
        this.Email = email;
    }

    public void setGender(String gender) {
        this.Gender = gender;
    }

    public void setBirthdate(String birthdate) {
        Birthdate = birthdate;
    }
}
