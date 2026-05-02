// eslint-disable-next-line
const styles = theme => ({
  root: {
    background: "#efefef",
    height: "100vh",
    padding: "0 16px",
    boxSizing: "border-box"
  },
  paper: {
    minWidth: 280,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "350px",
    minHeight: "230px",
    margin: "auto",
    alignItems: "center",
    padding: "20px 30px 30px 30px",
    boxSizing: "border-box",
    [theme.breakpoints.down("xs")]: {
      padding: "16px 20px 24px 20px",
      minWidth: "auto"
    }
  },
  loginContainer: {
    display: "flex",
    height: "calc(90vh)",
    width: "100%"
  },
  errorMessage: {
    width: "90%",
    marginTop: 20
  },
  wrapper: {
    marginTop: 20,
    position: "relative",
    width: "100%"
  },
  buttonProgress: {
    color: "black",
    position: "absolute",
    top: "50%",
    left: "40px",
    marginTop: -12,
    marginLeft: -12
  }
});

export default styles;
