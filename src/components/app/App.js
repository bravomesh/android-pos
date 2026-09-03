import React, { Fragment } from "react";
import { connect } from "react-redux";
import Home from "../home/Home";
import LoginPage from "../login/LoginPage";

const App = props => {
  const checkForAuth = () => {
    if (props.isLoggedIn) {
      return <Home />;
    }
    return <LoginPage />;
  };
  return <Fragment>{checkForAuth()}</Fragment>;
};

function mapStateToProps(state) {
  const isLoggedIn = state.auth !== undefined ? !!state.auth.tokens : false;

  return {
    isLoggedIn
  };
}

export default connect(mapStateToProps, null)(App);
