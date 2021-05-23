import { gql, useMutation } from "@apollo/client";
import { Button, Grid, Paper, makeStyles } from "@material-ui/core";
import React, { useEffect } from "react";
import useEffectUpdate from "../../../../hooks/useEffectUpdate";

const useStyles = makeStyles({
  root: {
    marginTop: "auto",
    marginBottom: "auto",
  },
  completed: {
    height: "40px",
    backgroundColor: "rgb(134, 219, 174)",
  },
  notCompleted: {
    height: "40px",
    backgroundColor: "rgb(219, 135, 134)",
  },
});

const COMPLETE_TASK = gql`
  mutation($taskId: Int!) {
    completeTask(taskid: $taskId)
  }
`;
const DELETE_TASK = gql`
  mutation($taskId: Int!) {
    disableTask(taskid: $taskId)
  }
`;

const TaskItem = ({
  title,
  time,
  completed,
  id,
  refetch,
}: {
  title: string;
  time: number;
  completed: boolean;
  id: number;
  refetch: () => void;
}) => {
  const classes = useStyles();
  const [completeTask, { loading: mutationLoading }] = useMutation(
    COMPLETE_TASK
  );
  const [deleteTask, { loading: deleteLoading }] = useMutation(DELETE_TASK);
  const handleCompleteTask = () => {
    completeTask({ variables: { taskId: id } });
  };
  const handleDeleteTask = () => {
    deleteTask({ variables: { taskId: id } });
  };
  useEffectUpdate(() => {
    if (!mutationLoading && !deleteLoading) {
      refetch();
    }
  }, [mutationLoading, deleteLoading]);
  return (
    <Paper className={completed ? classes.completed : classes.notCompleted}>
      <Grid justify="flex-end" container spacing={2}>
        <Grid
          item
          className={classes.root}
          style={{
            paddingLeft: "16px",
          }}
          xs={6}
        >
          {title}
        </Grid>
        <Grid item className={classes.root} xs={2}>
          <div>{time} minutes</div>
        </Grid>
        <Grid item xs={2}>
          <Button size="small" onClick={handleCompleteTask}>
            Complete
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button size="small" onClick={handleDeleteTask}>
            Delete
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TaskItem;
