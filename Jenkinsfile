pipeline {
  agent any
    
  stages {
    
        
    stage('Dev Deployment') {
      when { 
            branch 'main'
         } 
      steps {
         sh 'docker rm -f api-dev &> /dev/null'
         echo "Stopped previous container"
         sh 'docker-compose -f docker-compose-dev.yml up -d --build'
         echo "Development environment deployed successfully"
      }
    }
     
    stage('Production') {
      when { 
             branch 'master'
       }
      steps {
        sh 'docker rm -f api-prod &> /dev/null'
        echo "Stopped previous container"
        sh 'docker-compose -f docker-compose-prod.yml up -d --build'
        echo "Production environment deployed successfully"
      }
    }  
    
  }
}