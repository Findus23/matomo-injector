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
        stage('eslint') {
          steps {
            sh 'yarn run eslint'
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