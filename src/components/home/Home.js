import React from "react";
import Shell from "./Shell";
import Routes from "./Routes";
import BackupBanner from "../backup/BackupBanner";

const Home = () => (
  <Shell>
    <BackupBanner />
    <Routes />
  </Shell>
);

export default Home;
