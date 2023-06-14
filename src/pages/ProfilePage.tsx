import React from 'react';
import PageContent from '../components/PageContent';
import Profile from '../components/Profile';
import LoginInfo from '../components/LoginInfo';
import AuthenticatingInfo from '../components/AuthenticatingInfo';
import WithAuth from '../client/WithAuth';

const ProfilePage = (): React.ReactElement => (
  <PageContent>{WithAuth(Profile, LoginInfo, AuthenticatingInfo)}</PageContent>
);

export default ProfilePage;
