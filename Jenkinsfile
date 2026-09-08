pipeline {
  agent any

  triggers {
    githubPush()
  }

  parameters {
    choice(
      name: 'BRANCH_TO_TEST',
      choices: ['main', 'develop', 'release', 'feature/api-tests'],
      description: 'Branch to test when running manually.'
    )
    choice(
      name: 'ENVIRONMENT',
      choices: ['dev', 'qa', 'staging', 'prod'],
      description: 'Target environment for the API validation run.'
    )
    string(
      name: 'API_BASE_URL',
      defaultValue: 'https://fakerestapi.azurewebsites.net/api/v1',
      description: 'Base URL for the API under test.'
    )
    booleanParam(
      name: 'NOTIFY_EMAIL',
      defaultValue: false,
      description: 'Send email notifications after the build completes.'
    )
    booleanParam(
      name: 'NOTIFY_SLACK',
      defaultValue: false,
      description: 'Send Slack notifications after the build completes.'
    )
  }

  environment {
    NODE_ENV = 'test'
    REPORT_DIR = 'reports'
    CI = 'true'
  }

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {
    stage('Branch guard') {
      steps {
        script {
          def allowedBranches = ['main', 'develop', 'release', 'feature/*']
          def branchToRun = params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'main'
          def currentBranch = env.BRANCH_NAME ?: branchToRun

          if (env.BRANCH_NAME) {
            def branchMatches = allowedBranches.any { pattern ->
              if (pattern.endsWith('/*')) {
                return currentBranch.startsWith(pattern.replace('/*', ''))
              }
              return currentBranch == pattern
            }

            if (!branchMatches) {
              echo "Skipping push-triggered build for branch '${currentBranch}'. Allowed branches: ${allowedBranches.join(', ')}"
              currentBuild.result = 'ABORTED'
              error("Build aborted for non-approved branch: ${currentBranch}")
            }
          }

          echo "Selected branch to test: ${branchToRun}"
          echo "Environment: ${params.ENVIRONMENT}"
          echo "API Base URL: ${params.API_BASE_URL}"
        }
      }
    }

    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'main'}"]],
          userRemoteConfigs: [[url: scm.userRemoteConfigs[0].url]],
          extensions: []
        ])
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'npm install'
      }
    }

    stage('Run acceptance tests') {
      steps {
        script {
          try {
            sh 'mkdir -p reports'
            sh "API_BASE_URL='${params.API_BASE_URL}' npm test -- --format json:reports/cucumber-report.json"
          } catch (err) {
            currentBuild.result = 'FAILURE'
            throw err
          }
        }
      }
    }

    stage('Generate HTML report') {
      steps {
        sh 'npx mchr'
      }
    }

    stage('Publish HTML report') {
      steps {
        publishHTML(target: [
          allowMissing: false,
          alwaysLinkToLastBuild: true,
          keepAll: true,
          reportDir: 'reports/html',
          reportFiles: 'index.html',
          reportName: 'Acceptance Test Report'
        ])
      }
    }

    stage('Archive results') {
      steps {
        archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
      }
    }
  }

  post {
    success {
      script {
        notifyBuildStatus('SUCCESS')
      }
    }

    failure {
      script {
        notifyBuildStatus('FAILURE')
      }
    }

    unstable {
      script {
        notifyBuildStatus('UNSTABLE')
      }
    }
  }
}

void notifyBuildStatus(String status) {
  def subject = "${env.JOB_NAME} #${env.BUILD_NUMBER} - ${status}"
  def body = """
    <p>Build: ${env.JOB_NAME} #${env.BUILD_NUMBER}</p>
    <p>Status: ${status}</p>
    <p>Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'}</p>
    <p>Environment: ${params.ENVIRONMENT}</p>
    <p>Report: <a href='${env.BUILD_URL}artifact/reports/html/index.html'>Open HTML report</a></p>
  """

  if (params.NOTIFY_EMAIL) {
    try {
      withCredentials([string(credentialsId: 'EMAIL_RECIPIENTS', variable: 'EMAIL_RECIPIENTS')]) {
        if (env.EMAIL_RECIPIENTS?.trim()) {
          emailext(
            to: env.EMAIL_RECIPIENTS,
            subject: subject,
            body: body,
            mimeType: 'text/html'
          )
        } else {
          echo 'Email notifications enabled but EMAIL_RECIPIENTS credential is empty. Skipping email.'
        }
      }
    } catch (err) {
      echo "Email notification skipped: ${err.getMessage()}"
    }
  }

  if (params.NOTIFY_SLACK) {
    try {
      withCredentials([string(credentialsId: 'SLACK_CHANNEL', variable: 'SLACK_CHANNEL')]) {
        if (env.SLACK_CHANNEL?.trim()) {
          slackSend(
            channel: env.SLACK_CHANNEL,
            color: status == 'SUCCESS' ? 'good' : status == 'FAILURE' ? 'danger' : 'warning',
            message: "${env.JOB_NAME} #${env.BUILD_NUMBER} - ${status} | Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'} | Environment: ${params.ENVIRONMENT} | Report: ${env.BUILD_URL}artifact/reports/html/index.html"
          )
        } else {
          echo 'Slack notifications enabled but SLACK_CHANNEL credential is empty. Skipping Slack.'
        }
      }
    } catch (err) {
      echo "Slack notification skipped: ${err.getMessage()}"
    }
  }
}
