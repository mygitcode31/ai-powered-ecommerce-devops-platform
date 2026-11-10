pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Validate Project') {
            steps {
                sh '''
                    set -e
                    test -f docker-compose.yml
                    test -f my-medusa-store/Dockerfile.backend
                    test -f my-medusa-store/Dockerfile.storefront
                    echo "Project validation successful."
                '''
            }
        }

        stage('Check DevOps Tools') {
            steps {
                sh '''
                    git --version
                    docker --version
                    docker compose version
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                    set -e
                    IMAGE_TAG=$(git rev-parse --short=12 HEAD)

                    docker build \
                      -f my-medusa-store/Dockerfile.backend \
                      -t ecommerce-backend:$IMAGE_TAG \
                      my-medusa-store

                    echo "Backend image built: ecommerce-backend:$IMAGE_TAG"
                '''
            }
        }

        stage('Build Storefront Image') {
            steps {
                sh '''
                    set -e
                    IMAGE_TAG=$(git rev-parse --short=12 HEAD)

                    docker build \
                      --secret id=storefront_env,src=/var/lib/jenkins/secure-files/storefront.env \
                      -f my-medusa-store/Dockerfile.storefront \
                      -t ecommerce-storefront:$IMAGE_TAG \
                      my-medusa-store

                    echo "Storefront image built: ecommerce-storefront:$IMAGE_TAG"
                '''
            }
        }

        stage('Verify Images') {
            steps {
                sh '''
                    set -e
                    IMAGE_TAG=$(git rev-parse --short=12 HEAD)

                    docker image inspect ecommerce-backend:$IMAGE_TAG
                    docker image inspect ecommerce-storefront:$IMAGE_TAG

                    echo "Both Docker images verified."
                '''
            }
        }
    }

    post {
        success {
            echo 'CI pipeline completed successfully. Docker images are ready.'
        }

        failure {
            echo 'Pipeline failed. Check the console output.'
        }
    }
}
