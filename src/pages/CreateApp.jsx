import { useNavigate, useParams } from 'react-router-dom'

const CreateApp = () => {

    let params = useParams()

    localStorage.setItem("doctorID",params.id)
    
  return (
    <div>
    </div>
  )
}

export default CreateApp