import { Button, Grid } from "@material-ui/core";

const LoggedOutScreen = ({
  handleLoginClick,
  handleCreateAccountClick,
}: {
  handleLoginClick: () => void;
  handleCreateAccountClick: () => void;
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Button onClick={handleLoginClick}>Login</Button>
      </Grid>
      <Grid item xs={12}>
        <Button onClick={handleCreateAccountClick}>Create Account</Button>
      </Grid>
    </Grid>
  );
};

export default LoggedOutScreen;
