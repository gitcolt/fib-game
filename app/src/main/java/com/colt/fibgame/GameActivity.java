package com.colt.fibgame;

import android.os.Build;
import android.support.constraint.ConstraintLayout;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.transition.Scene;
import android.transition.TransitionManager;
import android.util.Log;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.webkit.WebView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.framework.CastButtonFactory;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManagerListener;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;

public class GameActivity extends AppCompatActivity {

    private ViewGroup mSceneRoot;
    private Scene mPlayerJoinScene;
    private Scene mReadyToPlayScene;
    private Scene mEnterLiesScene;
    private Scene mLieLockedInScene;
    private Scene mChoosingAnswerScene;
    private String mPlayerName;

    private CastContext mCastContext;
    private CastSession mCastSession;
    private FibCastChannel mFibCastChannel;

    private static final String TAG = GameActivity.class.getSimpleName();

    public enum State {
        REGISTERING_PLAYERS, SUBMITTING_LIE, CHOOSING_ANSWER, REVEALING_TRUTH, SHOWING_WINNER
    }
    private State currentState;

    EditText etPlayerName;
    EditText etEnterLie;
    ListView lvAnswers;

    private SessionManagerListener<CastSession> mSessionManagerListener = new SessionManagerListener<CastSession>() {
        @Override
        public void onSessionStarting(CastSession castSession) {

        }

        @Override
        public void onSessionStarted(CastSession castSession, String s) {
            Log.d(TAG, "Session started");
            mCastSession = castSession;
            invalidateOptionsMenu();
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
            if (mCastSession == castSession) {
                cleanupSession();
            }
            invalidateOptionsMenu();
        }

        @Override
        public void onSessionResuming(CastSession castSession, String s) {

        }

        @Override
        public void onSessionResumed(CastSession castSession, boolean b) {
            Log.d(TAG, "Session resumed");
            mCastSession = castSession;
            invalidateOptionsMenu();
        }

        @Override
        public void onSessionResumeFailed(CastSession castSession, int i) {

        }

        @Override
        public void onSessionSuspended(CastSession castSession, int i) {
            // ignore
        }
    };

    private void startCustomMessageChannel() {
        if(mCastSession != null && mFibCastChannel == null) {
            mFibCastChannel = new FibCastChannel(getString(R.string.cast_namespace));
            try {
                mCastSession.setMessageReceivedCallbacks(mFibCastChannel.getNamespace(),
                        mFibCastChannel);
                Log.d(TAG, "Message channel started");
            } catch (IOException e) {
                Log.d(TAG, "Error starting message channel", e);
                mFibCastChannel = null;
            }
        }
    }

    private void closeCustomMessageChannel() {
        if (mCastSession != null && mFibCastChannel != null) {
            try {
                mCastSession.removeMessageReceivedCallbacks(mFibCastChannel.getNamespace());
                Log.d(TAG, "Message channel closed");
            } catch (IOException e) {
                Log.d(TAG, "Error closing message channel", e);
            } finally {
                mFibCastChannel = null;
            }
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        setContentView(R.layout.activity_main);

        currentState = State.REGISTERING_PLAYERS;

        mSceneRoot = (ViewGroup) findViewById(R.id.scene_root);
        mPlayerJoinScene = Scene.getSceneForLayout(mSceneRoot, R.layout.player_join_scene, this);
        mReadyToPlayScene = Scene.getSceneForLayout(mSceneRoot, R.layout.ready_to_play_scene, this);
        mEnterLiesScene = Scene.getSceneForLayout(mSceneRoot, R.layout.enter_lies_scene, this);
        mLieLockedInScene = Scene.getSceneForLayout(mSceneRoot, R.layout.lies_locked_in_scene, this);
        mChoosingAnswerScene = Scene.getSceneForLayout(mSceneRoot, R.layout.choosing_answer_scene, this);

        etPlayerName = (EditText) findViewById(R.id.etPlayerName);


        // On Register Player
        etPlayerName.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView tv, int actionId, KeyEvent event) {
                if (actionId == EditorInfo.IME_ACTION_DONE) {
                    mPlayerName = tv.getText().toString();
                    registerPlayer(mPlayerName);
                    TransitionManager.go(mReadyToPlayScene);
                    return true;
                }
                return false;
            }
        });


        mCastContext = CastContext.getSharedInstance(this);
        mCastContext.registerLifecycleCallbacksBeforeIceCreamSandwich(this, savedInstanceState);
    }

    private void submitLie(String lie) {
        JSONObject data = new JSONObject();
        try {
            data.put("action", "submit lie");
            data.put("lie", lie);
            data.put("playerName", mPlayerName);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        sendMessage(data.toString());
    }

    private void registerPlayer(String playerName) {
        JSONObject data = new JSONObject();
        try {
            data.put("action", "register player");
            data.put("playerName", playerName);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        sendMessage(data.toString());
    }

    @Override
    protected void onResume() {
        super.onResume();

        mCastContext.getSessionManager().addSessionManagerListener(mSessionManagerListener, CastSession.class);
        if (mCastSession == null) {
            mCastSession = mCastContext.getSessionManager().getCurrentCastSession();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();

        mCastContext.getSessionManager().removeSessionManagerListener(mSessionManagerListener, CastSession.class);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        cleanupSession();
    }

    private void cleanupSession() {
        closeCustomMessageChannel();
        mCastSession = null;
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        super.onCreateOptionsMenu(menu);
        getMenuInflater().inflate(R.menu.main, menu);
        CastButtonFactory.setUpMediaRouteButton(getApplicationContext(),
                                                menu,
                                                R.id.media_route_menu_item);
        return true;
    }

    private void sendMessage(String message) {
        if (mFibCastChannel != null) {
            mCastSession.sendMessage(mFibCastChannel.getNamespace(), message);
        } else {
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        }
    }

    public void startGameButtonClicked(View v) {
        // Send start game action to the receiver
        // This should only happen once
        JSONObject data = new JSONObject();
        try {
            data.put("action", "start game");
        } catch (JSONException e){
            e.printStackTrace();
        }
        sendMessage(data.toString());

        startGame();
    }

    public void goToScene(Scene scene) {
        if (scene == mEnterLiesScene) {
            TransitionManager.go(mEnterLiesScene);
            etEnterLie = (EditText) findViewById(R.id.etEnterLie);

            // On Submit Lie
            etEnterLie.setOnEditorActionListener(new TextView.OnEditorActionListener() {
                @Override
                public boolean onEditorAction(TextView tv, int actionId, KeyEvent event) {
                    if (actionId == EditorInfo.IME_ACTION_DONE && currentState == State.SUBMITTING_LIE) {
                        submitLie(tv.getText().toString());
                        goToScene(mLieLockedInScene);
                        return true;
                    }
                    return false;
                }
            });
        }
        else if (scene == mLieLockedInScene) {
            TransitionManager.go(mLieLockedInScene);
        }
        else if (scene == mChoosingAnswerScene) {
            TransitionManager.go(mChoosingAnswerScene);
            lvAnswers = (ListView) findViewById(R.id.lvAnswers);
        }
    }

    public void startGame() {
        Toast.makeText(this, "STARTING GAME", Toast.LENGTH_SHORT).show();
        currentState = State.SUBMITTING_LIE;
        goToScene(mEnterLiesScene);
    }

    public void showAnswers(JSONArray JSONAnswers) {
        currentState = State.CHOOSING_ANSWER;
        goToScene(mChoosingAnswerScene);

        String[] answers = new String[JSONAnswers.length()];
        for (int i = 0; i < JSONAnswers.length(); i++) {
            try {
                JSONObject JSONAnswer = new JSONObject(JSONAnswers.get(i).toString());
                answers[i] = JSONAnswer.getString("text");
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, R.layout.answer, R.id.liAnswer, answers);
        lvAnswers.setAdapter(adapter);
    }

    class FibCastChannel implements Cast.MessageReceivedCallback {
        private final String mNamespace;

        FibCastChannel(String namespace) {
            mNamespace = namespace;
        }

        public String getNamespace() {
            return mNamespace;
        }

        // Messages from receiver
        @Override
        public void onMessageReceived(CastDevice castDevice, String namespace, String data) {
            try {
                JSONObject msg = new JSONObject(data);
                switch (msg.getString("action")) {
                    case "start game":
                        startGame();
                        break;
                    case "answers ready":
                        showAnswers(new JSONArray(msg.getString("answers")));
                        break;
                    default:
                        Toast.makeText(GameActivity.this, "UNKNOWN ACTION RECEIVED", Toast.LENGTH_SHORT).show();
                        Log.e(TAG, "Unknown action");
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
            //Toast.makeText(GameActivity.this, message, Toast.LENGTH_SHORT).show();
            Log.d(TAG, "onMessageReceived: " + data.toString());
        }
    }

}
