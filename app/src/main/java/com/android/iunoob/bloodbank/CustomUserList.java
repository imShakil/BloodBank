package com.android.iunoob.bloodbank;

import java.io.Serializable;

/***
 Project Name: BloodBank
 Project Date: 10/11/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class CustomUserList implements Serializable {
    private String Address, Division, Contact, PatientDescp;
    private String Name, BloodGroup, LastDonation;

    public CustomUserList() {

    }

    public CustomUserList(String Name, String address, String division, String bloodGroup, String contact, String patientDescp) {
        this.Name = Name;
        this.Address = address;
        this.Division = division;
        this.BloodGroup = bloodGroup;
        this.Contact = contact;
        this.PatientDescp = patientDescp;
    }

    public CustomUserList(String name, String bloodGroup, String lastDonation) {
        this.Name = name;
        this.BloodGroup = bloodGroup;
        this.LastDonation = lastDonation;
    }

    public String getAddress() {
        return Address;
    }

    public String getDivision() {
        return Division;
    }

    public String getContact() {
        return Contact;
    }

    public String getPatientDescp() {
        return PatientDescp;
    }

    public String getName() {
        return Name;
    }

    public String getBloodGroup() {
        return BloodGroup;
    }

    public String getLastDonation() {
        return LastDonation;
    }

    public void setAddress(String address) {
        this.Address = address;
    }

    public void setDivision(String division) {
        this.Division = division;
    }

    public void setContact(String contact) {
        this.Contact = contact;
    }

    public void setPatientDescp(String patientDescp) {
        this.PatientDescp = patientDescp;
    }

    public void setName(String name) {
        this.Name = name;
    }

    public void setBloodGroup(String bloodGroup) {
        this.BloodGroup = bloodGroup;
    }

    public void setLastDonation(String lastDonation) {
        this.LastDonation = lastDonation;
    }
}
