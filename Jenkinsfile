pipeline {
  agent {
    docker {
      image 'node'
    }

  }
  stages {
    stage('yarn install') {
      steps {
        sh 'yarn install --pure-lockfile --ignore-engines'
      }
    }
    stage('Tests') {
      parallel {
        stage('jshint') {
          steps {
            sh 'yarn run jshint'
          }
        }
        stage('webext_lint') {
          steps {
            sh 'yarn run webext_lint'
          }
        }
        stage('htmllint') {
          steps {
            sh 'yarn run htmllint'
          }
        }
      }
    }
  }
}