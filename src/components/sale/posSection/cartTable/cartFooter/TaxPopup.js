import React, { Component } from "react";
import { connect } from "react-redux";
import { withStyles } from "material-ui/styles";
import FormDialog from "../../../../controls/dialog/FormDialog";
import NumberTextField from "../../../../controls/textfields/NumberTextField";
import { updateTax } from "../../../../../actions/cart";

const styles = theme => ({
  textField: {
    width: "250px",
    [theme.breakpoints.down("xs")]: {
      width: "100%"
    }
  }
});

class TaxPopup extends Component {
  state = { tax: "", error: "" };

  onTaxChange = e => {
    const tax = e.target.value;

    this.setState({ tax, error: "" });
  };

  onSave = () => {
    const { tax } = this.state;

    if (tax === "") {
      this.setState({ error: "Enter the valid tax value" });
      return;
    }

    this.props.updateTax(tax);
    this.setState({ tax: "", error: "" });
    this.props.close();
  };

  onCancel = () => {
    this.props.close();
  };

  render() {
    const { open, classes } = this.props;
    const { tax, error } = this.state;

    return (
      <FormDialog
        onSave={this.onSave}
        onCancel={this.onCancel}
        open={open}
        title="Tax"
        subtitle="value entered here is considered as %"
      >
        <NumberTextField
          className={classes.textField}
          error={!!error}
          name="tax"
          value={tax}
          label="Amount"
          onChange={this.onTaxChange}
          helperText={error}
        />
        <div />
      </FormDialog>
    );
  }
}

export default connect(null, { updateTax })(withStyles(styles)(TaxPopup));
