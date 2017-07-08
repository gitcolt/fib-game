package com.colt.fibgame;

import android.animation.ObjectAnimator;
import android.graphics.Point;
import android.os.Bundle;
import android.support.constraint.ConstraintLayout;
import android.support.v4.app.Fragment;
import android.view.Display;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.LinearInterpolator;
import android.widget.Button;
import android.widget.LinearLayout;

/**
 * Created by Colt on 6/6/2017.
 */

public class ChooseAnswerFragment extends Fragment {

    ConstraintLayout cl;
    View timerBar;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.choose_answer_fragment, container, false);
        timerBar = view.findViewById(R.id.timer_bar);
        return view;
    }

    @Override
    public void onStart() {
        super.onStart();

        Bundle args = getArguments();
        String[] answers = args.getStringArray("answers");

        LinearLayout ll = (LinearLayout) getActivity().findViewById(R.id.ll_answers_container);
        for (int i = 0; i < answers.length; i++) {
            Button bAnswer = (Button) View.inflate(getContext(), R.layout.answer_template, null);
            bAnswer.setText(answers[i]);
            bAnswer.setId(View.generateViewId());
            ll.addView(bAnswer);
        }

        // Get screen width
        Display display = getActivity().getWindowManager().getDefaultDisplay();
        Point point=new Point();
        display.getSize(point);
        final int width = point.x;

        // have to add ~30 pixels for some reason
        timerBar.animate().x(-(width + 30)).setDuration(4000).setInterpolator(new LinearInterpolator());

    }
}