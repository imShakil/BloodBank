package com.android.iunoob.bloodbank.viewmodels;

/***
 Project Name: BloodBank
 Project Date: 10/12/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class UserData {

    private String Name, Email, Contact, Address;
    private int Gender, BloodGroup, Division;

    public UserData() {

    }

    public String getContact() {
        return Contact;
    }

    public void setContact(String contact) {
        Contact = contact;
    }

    public String getAddress() {
        return Address;
    }

    public void setAddress(String address) {
        this.Address = address;
    }

    public int getDivision() {
        return Division;
    }

    public void setDivision(int division) {
        this.Division = division;
    }

    public String getName() {
        return Name;
    }

    public int getBloodGroup() {
        return BloodGroup;
    }

    public void setBloodGroup(int bloodGroup) {
        this.BloodGroup = bloodGroup;
    }

    public String getEmail() {
        return Email;
    }

    public int getGender() {
        return Gender;
    }

    public void setName(String name) { this.Name = name; }

    public void setEmail(String email) {
        this.Email = email;
    }

    public void setGender(int gender) {
        this.Gender = gender;
    }


}
