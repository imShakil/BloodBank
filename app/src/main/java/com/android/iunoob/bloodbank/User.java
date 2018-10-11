package com.android.iunoob.bloodbank;

/***
 Project Name: BloodBank
 Project Date: 10/10/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class User {
    String UserId;
    String UserName;
    String UserBdate;
    String Gender;
    public User() {
    }

    public User(String userId, String userName, String userGender, String userBdate) {
        this.UserId = userId;
        this.UserName = userName;
        this.Gender = userGender;
        this.UserBdate = userBdate;
    }

    public String getUserId() {
        return UserId;
    }

    public String getUserName() {
        return UserName;
    }

    public String getGender() {
        return Gender;
    }

    public String getUserBdate() {
        return UserBdate;
    }
}
