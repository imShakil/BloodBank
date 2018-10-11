package com.android.iunoob.bloodbank;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import java.util.List;

/***
 Project Name: BloodBank
 Project Date: 10/11/18
 Created by: imshakil
 Email: mhshakil_ice_iu@yahoo.com
 ***/

public class BloodRequestAdapter extends BaseAdapter {

    Context mcontext;
    List<CustomUserList> customUserLists;

    public BloodRequestAdapter(Context mcontext, List<CustomUserList> customUserLists) {
        this.mcontext = mcontext;
        this.customUserLists = customUserLists;
    }

    @Override
    public int getCount() {
        return customUserLists.size();
    }

    @Override
    public Object getItem(int position) {
        return customUserLists.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {

        View view = View.inflate(mcontext, R.layout.row_item, null);

        TextView Name, blooddgroup, donateDate;
        Name = (TextView) view.findViewById(R.id.donorName);
        blooddgroup = (TextView) view.findViewById(R.id.setBloodGroup);
        donateDate =  (TextView) view.findViewById(R.id.donated);

        Name.setText(customUserLists.get(position).getName());
        blooddgroup.setText(customUserLists.get(position).getBloodGroup());
        donateDate.setText(customUserLists.get(position).getLastDonation());

        return view;
    }
}
