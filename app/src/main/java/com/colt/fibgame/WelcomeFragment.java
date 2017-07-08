package com.colt.fibgame;

import android.content.Context;
import android.graphics.Point;
import android.os.Bundle;
import android.os.Debug;
import android.support.v4.app.Fragment;
import android.support.v7.app.MediaRouteButton;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import com.google.android.gms.cast.framework.CastButtonFactory;

/**
 * Created by Colt on 6/5/2017.
 */

public class WelcomeFragment extends Fragment {

    MediaRouteButton castButton;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.welcome_fragment, container, false);
        castButton = (MediaRouteButton) view.findViewById(R.id.media_route_button);
        CastButtonFactory.setUpMediaRouteButton(getActivity().getApplicationContext(), castButton);

        return view;
    }

    @Override
    public void onStart() {
        super.onStart();

    }

}
