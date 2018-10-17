package com.android.iunoob.bloodbank.viewmodels;

/***
 Project Name: BloodBank
 Project Date: 10/17/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class DonorData {

    private int TotalDonate;
    private String LastDonate, donorName, donorContact, UID, Address;


    public DonorData() {

    }

    public DonorData(int totalDonate, String lastDonate, String donorName, String donorContact, String Address, String UID) {
        this.TotalDonate = totalDonate;
        this.LastDonate = lastDonate;
        this.donorName = donorName;
        this.donorContact = donorContact;
        this.UID = UID;
        this.Address = Address;
    }

    public int getTotalDonate() {
        return TotalDonate;
    }

    public void setTotalDonate(int totalDonate) {
        this.TotalDonate = totalDonate;
    }

    public String getLastDonate() {
        return LastDonate;
    }

    public void setLastDonate(String lastDonate) {
        this.LastDonate = lastDonate;
    }

    public String getUID() {
        return UID;
    }

    public void setUID(String UID) {
        this.UID = UID;
    }

    public String getDonorName() {
        return donorName;
    }

    public void setDonorName(String donorName) {
        this.donorName = donorName;
    }

    public String getDonorContact() {
        return donorContact;
    }

    public void setDonorContact(String donorContact) {
        this.donorContact = donorContact;
    }

    public String getAddress() {
        return Address;
    }

    public void setAddress(String address) {
        Address = address;
    }
}
