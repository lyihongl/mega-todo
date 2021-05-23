import { createStyles, makeStyles, Theme } from "@material-ui/core";

const useStyles = makeStyles<Theme>((theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
  })
);

export default useStyles;
