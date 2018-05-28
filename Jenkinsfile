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
        stage('eshint') {
          steps {
            sh 'yarn run eshint'
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