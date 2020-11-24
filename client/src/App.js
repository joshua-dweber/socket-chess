import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import SignIn from './components/SignIn';
import { useCookies } from 'react-cookie';

function App() {
    const [cookies, setCookie, removeCookie] = useCookies(['name']);
    const [signedIn, setSignedIn] = useState(false);

    const setCookiesProp = (num, _id) => {
        // setCookie("currentUser", num);
        setCookie("currentUser", num);
        setCookie("currentId", _id);
        setSignedIn(true);
        console.log(cookies);
    }

    const reset = () => {
        setCookie("currentUser", "")
        setCookie("currentId", "")
        setSignedIn(false);
    }
    
    useEffect(() => {
        if(cookies.currentUser) {
            setSignedIn(true)
        }
        console.log(cookies);
    }, []);
    return (
        <div className="App" style={{ "backgroundColor": "#b8deff", "width": "100%", "min-height": "100vh", "display": "flex", "justifyContent": "center", "alignItems": "center", "flexDirection": "column"}}>
            {signedIn ? <Game userId={cookies.currentUser} reset={reset} /> : <SignIn setCookies={setCookiesProp}/>}
        </div>
    );
}

export default App;
