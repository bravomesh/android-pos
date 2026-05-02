// eslint-disable-next-line
const styles = theme => ({
  root: {
    padding: 10,
    [theme.breakpoints.down("sm")]: {
      padding: 5
    }
  },
  flexContainer: {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
    height: "auto",
    minHeight: "100%",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column-reverse"
    }
  },
  pos: {
    width: "460px",
    margin: "10px",
    minHeight: "500px",
    [theme.breakpoints.down("md")]: {
      width: "100%",
      maxWidth: "460px",
      margin: "10px auto"
    },
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      maxWidth: "100%",
      margin: "5px",
      minHeight: "auto"
    }
  },
  posContent: {
    minHeight: "100%",
    margin: "0 auto -130px",
    [theme.breakpoints.down("sm")]: {
      margin: "0 auto -100px"
    }
  },
  items: {
    flex: 1,
    margin: "20px",
    minWidth: "300px",
    [theme.breakpoints.down("sm")]: {
      margin: "5px",
      minWidth: "auto",
      width: "100%"
    }
  }
});

export default styles;
