package com.android.iunoob.bloodbank.adapters;

import android.annotation.SuppressLint;
import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.android.iunoob.bloodbank.viewmodels.CustomUserData;
import com.android.iunoob.bloodbank.R;

import java.util.List;

/***
 Project Name: BloodBank
 Project Date: 10/11/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class RecentDonorAdapter extends BaseAdapter {

    Context mcontext;
    List<CustomUserData> customUserData;

    public RecentDonorAdapter(Context mcontext, List<CustomUserData> customUserData) {
        this.mcontext = mcontext;
        this.customUserData = customUserData;
    }

    @Override
    public int getCount() {
        return customUserData.size();
    }

    @Override
    public Object getItem(int position) {
        return customUserData.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {

        @SuppressLint("ViewHolder") View view = View.inflate(mcontext, R.layout.row_item, null);

        TextView Name, blooddgroup, donateDate;
        Name = (TextView) view.findViewById(R.id.donorName);
        blooddgroup = (TextView) view.findViewById(R.id.setBloodGroup);
        donateDate =  (TextView) view.findViewById(R.id.donated);

        Name.setText(customUserData.get(position).getName());
        blooddgroup.setText(customUserData.get(position).getBloodGroup());
        donateDate.setText(customUserData.get(position).getLastDonation());

        return view;
    }
}
