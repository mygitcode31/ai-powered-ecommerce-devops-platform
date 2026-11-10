pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Validate Project Structure') {
            steps {
                sh '''
                    echo "Checking project files..."

                    test -f docker-compose.yml
                    test -f my-medusa-store/Dockerfile.backend
                    test -f my-medusa-store/Dockerfile.storefront

                    echo "Project structure validation successful."
                '''
            }
        }

        stage('Check DevOps Tools') {
            steps {
                sh '''
                    echo "Checking Git..."
                    git --version

                    echo "Checking Docker..."
                    docker --version

                    echo "Checking Docker Compose..."
                    docker compose version

                    echo "Tool verification successful."
                '''
            }
        }
    }

    post {
        success {
            echo 'CI Pipeline completed successfully!'
        }

        failure {
            echo 'CI Pipeline failed. Check the console output.'
        }
    }
}
