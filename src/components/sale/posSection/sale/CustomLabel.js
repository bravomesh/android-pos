import React from "react";
import { withStyles } from "material-ui/styles";
import classNames from "classnames";

const styles = theme => ({
  underline: {
    width: "100%",
    maxWidth: "470px",
    height: "1px",
    margin: "5px 0px 5px 0px",
    background: "transparent",
    backgroundSize: "5px 1px",
    backgroundImage:
      "linear-gradient(to right, rgba(0, 0, 0, 0.42) 33%, transparent 0%)",
    backgroundRepeat: "repeat-x",
    backgroundPosition: "left bottom",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "100%"
    }
  },
  label: {
    display: "block",
    color: "rgba(0, 0, 0, 0.54)",
    fontSize: "0.755rem"
  },
  labelText: {
    marginTop: "10px",
    color: "#9e9e9e",
    fontSize: "16px",
    [theme.breakpoints.down("sm")]: {
      fontSize: "14px"
    }
  }
});

const CustomLabel = ({ classes, title, text, helperText, labelStyle }) => {
  const labelStyle2 = labelStyle !== undefined ? labelStyle : {};

  return (
    <div>
      <span className={classes.label}>{title}</span>
      <span
        className={classNames(classes.label, classes.labelText)}
        style={labelStyle2}
      >
        {text}
      </span>
      <div className={classes.underline} />
      {helperText && <span className={classes.label}>{helperText}</span>}
    </div>
  );
};

export default withStyles(styles)(CustomLabel);
