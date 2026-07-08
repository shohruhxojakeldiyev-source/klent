import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const CreateApp = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      localStorage.setItem("doctor_id", id)
    }
    navigate("/", { replace: true })
  }, [])

  return <div />
}

export default CreateApp
