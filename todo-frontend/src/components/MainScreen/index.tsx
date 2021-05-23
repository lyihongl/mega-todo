import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Button, Grid } from "@material-ui/core";
import { lazy, Suspense, useEffect } from "react";
import { Screens } from "./constants";
import LoggedInScreen from "../LoggedInScreen";
import * as Interface from "./MainScreen";
import useStyles from "./styles";
import Cookies from "js-cookie";
import { UserStateContext } from "../../App";

const LoginScreen = lazy(() => import("../LoginScreen"));
const CreateAccountScreen = lazy(() => import("../CreateAccountScreen"));
const LoggedOutScreen = lazy(() => import("../LoggedOutScreen"));

type DynamicRenderProps = {
  children: ReactNode;
};

export const ScreenContext = createContext<Interface.IScreens>({
  screen: Screens.Main,
  setScreen: (s: Screens) => {},
});

const DynamicRender = ({ children }: DynamicRenderProps) => {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
};

const MainScreen = () => {
  const [screen, setScreen] = useState<Screens>(Screens.Main);
  const userContext = useContext(UserStateContext);

  const classes = useStyles();

  const handleLoginClick = useCallback(() => {
    setScreen(Screens.Login);
  }, [setScreen, Screens]);

  const handleCreateAccountClick = useCallback(() => {
    setScreen(Screens.CreateAccount);
  }, [setScreen, Screens]);

  const renderScreen = (screen: Screens) => {
    switch (screen) {
      case Screens.Main: {
        return (
          <>
            {Cookies.get("jwt") ? (
              <DynamicRender>
                <LoggedInScreen />
              </DynamicRender>
            ) : (
              <DynamicRender>
                <LoggedOutScreen
                  handleLoginClick={handleLoginClick}
                  handleCreateAccountClick={handleCreateAccountClick}
                />
              </DynamicRender>
            )}
          </>
        );
      }
      case Screens.Login: {
        return (
          <DynamicRender>
            <LoginScreen />
          </DynamicRender>
        );
      }
      case Screens.CreateAccount: {
        return (
          <DynamicRender>
            <CreateAccountScreen />
          </DynamicRender>
        );
      }
      default: {
      }
    }
  };

  return (
    <div className={classes.root}>
      <ScreenContext.Provider value={{ screen, setScreen }}>
        {renderScreen(screen)}
      </ScreenContext.Provider>
    </div>
  );
};

export default MainScreen;
