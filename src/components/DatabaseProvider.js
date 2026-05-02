/**
 * Database Provider Component
 *
 * This component initializes the SQLite database before rendering
 * the rest of the application. Shows a loading screen during init.
 */

import React, { Component } from 'react';
import { CircularProgress } from 'material-ui/Progress';
import DatabaseService from '../services/database/DatabaseService';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#3f51b5'
  },
  text: {
    color: 'white',
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'Roboto, sans-serif'
  },
  subText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Roboto, sans-serif'
  },
  error: {
    color: '#ff5252',
    marginTop: 20,
    fontSize: 14,
    fontFamily: 'Roboto, sans-serif',
    textAlign: 'center',
    padding: '0 20px'
  },
  retryButton: {
    marginTop: 20,
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#3f51b5',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer'
  }
};

class DatabaseProvider extends Component {
  state = {
    isInitializing: true,
    error: null
  };

  componentDidMount() {
    this.initializeDatabase();
  }

  initializeDatabase = async () => {
    this.setState({ isInitializing: true, error: null });

    try {
      await DatabaseService.initialize();
      this.setState({ isInitializing: false });
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.setState({
        isInitializing: false,
        error: error.message || 'Failed to initialize database'
      });
    }
  };

  render() {
    const { isInitializing, error } = this.state;
    const { children } = this.props;

    if (isInitializing) {
      return (
        <div style={styles.container}>
          <CircularProgress style={{ color: 'white' }} size={60} />
          <div style={styles.text}>Initializing Mobile POS</div>
          <div style={styles.subText}>Setting up database...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.container}>
          <div style={styles.text}>Initialization Error</div>
          <div style={styles.error}>{error}</div>
          <button style={styles.retryButton} onClick={this.initializeDatabase}>
            Retry
          </button>
        </div>
      );
    }

    return children;
  }
}

export default DatabaseProvider;
