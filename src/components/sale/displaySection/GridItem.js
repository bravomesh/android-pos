import React, { Component } from "react";
import { Paper, Avatar } from "material-ui";
import { withStyles } from "material-ui/styles";

const styles = theme => ({
  purpleAvatar: {
    color: "#fff",
    backgroundColor: "#3f50b5"
  },
  gridItem: {
    width: 150,
    height: 150,
    overflow: "auto",
    display: "inline-block",
    margin: 4,
    [theme.breakpoints.down("sm")]: {
      width: "calc(50% - 8px)",
      minWidth: 120,
      height: "auto",
      minHeight: 130
    },
    [theme.breakpoints.down("xs")]: {
      width: "calc(50% - 8px)",
      minWidth: 100,
      minHeight: 120
    }
  },
  itemContent: {
    paddingTop: 30,
    [theme.breakpoints.down("sm")]: {
      paddingTop: 20
    }
  },
  itemText: {
    width: 130,
    overflowWrap: "break-word",
    padding: 5,
    fontSize: "13px",
    margin: "auto",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      fontSize: "12px",
      padding: 3
    }
  }
});

class GridItem extends Component {
  state = {};

  render() {
    const { classes } = this.props;

    return (
      <Paper className={classes.gridItem}>
        <div className={classes.itemContent}>
          <Avatar style={{ margin: "auto" }} className={classes.purpleAvatar}>
            BR
          </Avatar>
        </div>
        <div style={{ textAlign: "center" }}>
          <p className={classes.itemText}>
            Britania Tiger
          </p>
        </div>
      </Paper>
    );
  }
}

export default withStyles(styles, { withTheme: true })(GridItem);
