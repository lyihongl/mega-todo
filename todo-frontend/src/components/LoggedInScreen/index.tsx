import { gql, useQuery } from "@apollo/client";
import { Button, Grid } from "@material-ui/core";
import React, { useCallback, useEffect, useState } from "react";
import TaskItem from "./components/TaskItem";
import AddTaskModal from "./components/AddTaskModal";

const GET_TASKS = gql`
  query {
    getTasks {
      id
      title
      time
      completed
    }
  }
`;

type TaskResponseElement = {
  id: number;
  title: string;
  time: number;
  completed: boolean;
};

type TaskResponse = {
  getTasks: TaskResponseElement[];
};

const LoggedInScreen = () => {
  const [open, setOpen] = useState<boolean>(false);
  const { loading, error, data, refetch } = useQuery<TaskResponse>(GET_TASKS);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <Grid container spacing={2} style={{ maxWidth: "70%" }}>
      <Grid item xs={12}>
        <Button onClick={handleOpen}>Add Task</Button>
      </Grid>
      <AddTaskModal open={open} onClose={handleClose} refetch={refetch} />
      {data &&
        data!.getTasks.map((e) => (
          <Grid item xs={12}>
            <TaskItem
              title={e.title}
              time={e.time}
              completed={e.completed}
              id={e.id}
              refetch={refetch}
            />
          </Grid>
        ))}
    </Grid>
  );
};

export default LoggedInScreen;
