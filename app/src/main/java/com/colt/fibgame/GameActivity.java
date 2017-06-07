package com.colt.fibgame;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentTransaction;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManagerListener;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class GameActivity extends FragmentActivity {

    private CastContext castContext;
    private CastSession castSession;
    private FibCastChannel fibCastChannel;

    private EditText etPlayerName;
    private EditText etLie;
    private TextView tvCurrQuestion;

    private String playerName = "";

    private static final String TAG = GameActivity.class.getSimpleName();

    public void onJoinButtonClicked(View v) {
        etPlayerName = (EditText) findViewById(R.id.etPlayerName);
        playerName = etPlayerName.getText().toString();

        JSONObject data = new JSONObject();
        try {
            data.put("action", "register player");
            data.put("playerName", playerName);
        } catch (JSONException e ){
            e.printStackTrace();
        }
        sendMessage(data.toString());

        Bundle arguments = new Bundle();
        arguments.putString("playerName", playerName);
        goToFragment(new ReadyToPlayFragment(), arguments);
    }

    public void onStartGameButtonClicked(View v) {
        JSONObject data = new JSONObject();
        try {
            data.put("action", "start game");
        } catch (JSONException e ){
            e.printStackTrace();
        }
        sendMessage(data.toString());
    }

    public void onSubmitLieButtonClicked(View v) {
        etLie = (EditText) findViewById(R.id.etLie);
        String lie = etLie.getText().toString();

        JSONObject data = new JSONObject();
        try {
            data.put("action", "submit lie");
            data.put("lie", lie);
            data.put("playerName", playerName);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        sendMessage(data.toString());
        goToFragment(new LieSubmittedFragment(), null);
    }

    public void onAnswerClicked(View v) {
        Toast.makeText(this, "YOU CHOSE AN ANSWER", Toast.LENGTH_SHORT).show();
        int clickedId = v.getId();
        LinearLayout answersContainer = (LinearLayout) findViewById(R.id.ll_answers_container);
        for(int i = 0; i < answersContainer.getChildCount(); ++i) {
            View answer = answersContainer.getChildAt(i);
            if (answer.getId() != clickedId) {
                answer.setVisibility(View.GONE);
                answersContainer.removeView(answer);
            }
        }
        answersContainer.invalidate();
    }

    private SessionManagerListener<CastSession> sessionManagerListener =
            new SessionManagerListener<CastSession>() {
                @Override
                public void onSessionStarting(CastSession castSession) {

                }

                @Override
                public void onSessionStarted(CastSession castSession, String s) {
                    Log.d(TAG, "Session started");
                    GameActivity.this.castSession = castSession;
                    startCustomMessageChannel();
                }

                @Override
                public void onSessionStartFailed(CastSession castSession, int i) {

                }

                @Override
                public void onSessionEnding(CastSession castSession) {

                }

                @Override
                public void onSessionEnded(CastSession castSession, int i) {
                    Log.d(TAG, "Session ended");
                    if (GameActivity.this.castSession == castSession) {
                        cleanupSession();
                    }
                }

                @Override
                public void onSessionResuming(CastSession castSession, String s) {

                }

                @Override
                public void onSessionResumed(CastSession castSession, boolean b) {
                    Log.d(TAG, "Session resumed");
                    GameActivity.this.castSession = castSession;
                }

                @Override
                public void onSessionResumeFailed(CastSession castSession, int i) {

                }

                @Override
                public void onSessionSuspended(CastSession castSession, int i) {

                }
            };


    @Override
    protected void onResume() {
        super.onResume();
        // Register cast session listener
         castContext.getSessionManager().addSessionManagerListener(sessionManagerListener,
                CastSession.class);
        if (castSession == null) {
            // Get the current session if there is one
            castSession = castContext.getSessionManager().getCurrentCastSession();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Unregister cast session listener
        castContext.getSessionManager().removeSessionManagerListener(sessionManagerListener,
                CastSession.class);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        cleanupSession();
    }

    private void cleanupSession() {
        closeCustomChannel();
        castSession = null;
    }

    private void goToFragment(Fragment frag, @Nullable Bundle args) {
        if (args != null) {
            frag.setArguments(args);
        }
        FragmentTransaction transaction = getSupportFragmentManager().beginTransaction();
        transaction.replace(R.id.fragment_container, frag).addToBackStack(null).commit();
    }

    private void startCustomMessageChannel() {
        if (castSession != null && fibCastChannel == null) {
            fibCastChannel = new FibCastChannel(getString(R.string.cast_namespace));
            try {
                castSession.setMessageReceivedCallbacks(fibCastChannel.getNamespace(),
                        fibCastChannel);
                Log.d(TAG, "Message channel started");

                // When connected to Chromecast receiver, proceed to Register Player Fragment
                goToFragment(new RegisterPlayerFragment(), null);
            } catch (IOException e) {
                Log.d(TAG, "Error starting message channel", e);
                fibCastChannel = null;
            }
        }
    }

    private void closeCustomChannel() {
        if (castSession != null && fibCastChannel != null) {
            try {
                castSession.removeMessageReceivedCallbacks(fibCastChannel.getNamespace());
                Log.d(TAG, "Message channel closed");
            } catch (IOException e) {
                Log.d(TAG, "Error closing message channel", e);
            } finally {
                fibCastChannel = null;
            }
        }
    }

    class FibCastChannel implements Cast.MessageReceivedCallback {
        private final String namespace;

        FibCastChannel(String namespace) {
            this.namespace = namespace;
        }

        public String getNamespace() {
            return this.namespace;
        }

        @Override
        public void onMessageReceived(CastDevice castDevice, String namespace, String message) {
            Log.d(TAG, "onMessageReceived: " + message);
            try {
                JSONObject data = new JSONObject(message);
                switch (data.getString("action")) {
                    case "start game":
                        goToFragment(new EnterLieFragment(), null);
                        break;
                    case "new question":
                        tvCurrQuestion = (TextView) findViewById(R.id.tvCurrQuestion);
                        tvCurrQuestion.setText(data.getString("question"));
                        break;
                    case "answers ready":
                        JSONArray jAnswers = data.getJSONArray("answers");
                        List<String> lAnswers = new ArrayList<String>();
                        for (int i = 0; i < jAnswers.length(); i++) {
                            lAnswers.add(jAnswers.getJSONObject(i).getString("text"));
                        }
                        String[] answers = lAnswers.toArray(new String[0]);
                        Bundle args = new Bundle();
                        args.putStringArray("answers", answers);
                        goToFragment(new ChooseAnswerFragment(), args);
                        break;
                    default:
                        break;
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }

        }
    }

    private void sendMessage(String message) {
        if (fibCastChannel != null) {
            castSession.sendMessage(fibCastChannel.getNamespace(), message);
        } else {
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        }
    }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.game);

        if (savedInstanceState != null) {
            return;
        }

        WelcomeFragment welcomeFragment = new WelcomeFragment();
        getSupportFragmentManager().beginTransaction().add(R.id.fragment_container, welcomeFragment).commit();

        castContext = CastContext.getSharedInstance(this);
    }

    public void onButtonClicked(View v) {

    }
}
