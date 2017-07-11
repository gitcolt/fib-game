package com.colt.fibgame;


import android.animation.ObjectAnimator;
import android.graphics.Point;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.Display;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.LinearInterpolator;
import android.widget.EditText;
import android.widget.TextView;

/**
 * Created by Colt on 6/6/2017.
 */

public class EnterLieFragment extends Fragment {

    TextView tvCurrQuestion;
    View timerBar;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.enter_lie_fragment, container, false);
        tvCurrQuestion = (TextView) view.findViewById(R.id.tvCurrQuestion);
        timerBar = view.findViewById(R.id.timer_bar);
        return view;
    }

    @Override
    public void onStart() {
        super.onStart();

        Bundle args = getArguments();
        String question = args.getString("question");
        tvCurrQuestion.setText(question);

        // Get screen width
        Display display = getActivity().getWindowManager().getDefaultDisplay();
        Point point=new Point();
        display.getSize(point);
        final int width = point.x;

        // have to add ~30 pixels for some reason
        timerBar.animate().x(-(width + 30)).setDuration(30000).setInterpolator(new LinearInterpolator());
    }
}
