import { gql, useMutation } from "@apollo/client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Select,
  MenuItem,
  makeStyles,
} from "@material-ui/core";
import { useState } from "react";

const useStyles = makeStyles({
  select: {
    height: "20px",
    padding: "10px",
  },
  modal: {
    height: "320px",
  },
});

const CREATE_TASK = gql`
  mutation CreateTask($title: String!, $time: Int!) {
    createTask(taskInfo: { title: $title, time: $time })
  }
`;

const AddTaskModal = ({
  open,
  onClose,
  refetch,
}: {
  open: boolean;
  onClose: () => void;
  refetch: () => void;
}) => {
  const classes = useStyles();
  const [title, setTitle] = useState<String>("");
  const [createTask, { data }] = useMutation(CREATE_TASK);
  const [time, setTime] = useState<number | undefined>(undefined);
  const [timeUnit, setTimeUnit] = useState<number>(1);

  const validateTask = async () => {
    if (!title || time === 0 || !time) {
      return;
    } else {
      const totalTime: number = time * timeUnit;
      try {
        await createTask({
          variables: {
            title,
            time: totalTime,
          },
        });
        setTitle("");
        setTime(undefined);
        setTimeUnit(1);
        onClose();
        refetch();
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.currentTarget.value);
  };
  const handleTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (parseInt(e.currentTarget.value) >= 0) {
      setTime(parseInt(e.currentTarget.value));
    } else if (e.currentTarget.value == "") {
      setTime(undefined);
    }
  };
  const handleTimeUnit = (e: React.ChangeEvent<{ value: unknown }>) => {
    setTimeUnit(e.target.value as number);
  };
  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      classes={{ paper: classes.modal }}
    >
      <DialogTitle>Add Task</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Task name"
              fullWidth
              variant="outlined"
              size="small"
              value={title}
              onChange={handleTitle}
            />
          </Grid>
          <Grid item xs={9}>
            <TextField
              type="number"
              label="Time per day"
              fullWidth
              variant="outlined"
              size="small"
              value={time}
              onChange={handleTime}
            />
          </Grid>
          <Grid item xs={3}>
            <Select
              classes={{ root: classes.select }}
              placeholder="Time unit"
              fullWidth
              variant="outlined"
              value={timeUnit}
              onChange={handleTimeUnit}
            >
              <MenuItem value={1}>Minutes</MenuItem>
              <MenuItem value={60}>Hours</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={validateTask}>Add</Button>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTaskModal;
