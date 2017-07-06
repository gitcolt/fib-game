package com.colt.fibgame;


import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;

/**
 * Created by Colt on 6/6/2017.
 */

public class EnterLieFragment extends Fragment {

    TextView tvCurrQuestion;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.enter_lie_fragment, container, false);
        tvCurrQuestion = (TextView) view.findViewById(R.id.tvCurrQuestion);
        return view;
    }

    @Override
    public void onStart() {
        super.onStart();

        Bundle args = getArguments();
        String question = args.getString("question");
        tvCurrQuestion.setText(question);
    }
}
