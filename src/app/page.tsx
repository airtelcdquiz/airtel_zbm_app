'use server'
// import query from "@/lib/query";
import {User} from '@/lib/types'

 

export default async function Home() {
  try {
    // Créer une instance Sequelize
    // const [rows, fields] = await query('select * from users');
    // const users: User[] = JSON.parse(JSON.stringify(rows))
    // return <div>
    //   <p>{JSON.stringify(users)}</p>
    // </div>
    
  } catch (e) {
    console.log(e)
  }

  const students = [
    {
      name: 'Daniel Alves',
      phone: '1234567890', 
      class: '7 ème Education de base'
    },
    {
      name: 'Marie Dubois',
      phone: '6789054321',
      class: '8 ème Education de base'
    },
    {
      name: 'Jean Pierre',
      phone: '9876543210',
      class: '6 ème Education de base'
    },
    {
      name: 'Sophie Martin',
      phone: '5432167890',
      class: '7 ème Education de base'
    },
    {
      name: 'Lucas Bernard',
      phone: '0123456789',
      class: '8 ème Education de base'
    },
    {
      name: 'Emma Petit',
      phone: '9870123456',
      class: '6 ème Education de base'
    },
    {
      name: 'Thomas Roux',
      phone: '6543210987',
      class: '7 ème Education de base'
    },
    {
      name: 'Julie Moreau',
      phone: '0987654321',
      class: '8 ème Education de base'
    }
  ]
  return (
    <div className="flex flex-row w-full h-full">
      <div className='flex-1'>
      <div className="flex flex-row w-full items-center justify-between mt-[30px]">
        <p className="text-2xl font-bold">Liste des Élèves</p> 
      </div>
      <div className='bg-[rgba(255,255,255,0.4)] w-full mt-[20px] divide-accent divide-y-[1px]'> 
        <div className='flex items-center gap-[10px] px-[15px] py-[7px]'>
          <div className='flex-1 relative'>
            <input 
              type="text"
              placeholder="Rechercher un élève..."
              className="w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>
        <div className='flex items-center gap-[10px] px-[15px] py-[7px] cursor-pointer text-[13px] font-bold'>
          <p className='flex-1'>Nom</p>
          <p className='w-[100px]'>Téléphone</p>
          <p className='w-[200px]'>Classe</p>
        </div>
         {
          students.map((student, index) => (
            <div key={index} className='duration-300 hover:bg-accent flex items-center gap-[10px] px-[15px] py-[7px] cursor-pointer text-[13px] text-gray-700'>
              <p className='flex-1'>{student.name}</p>
              <p className='w-[100px]'>{student.phone}</p>
              <p className='w-[200px]'>{student.class}</p>
            </div>
          ))
         }
      </div>
      </div>
      <div className="h-full w-[300px] bg-white shadow-lg p-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold">Filtres</h3>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Niveau</label>
            <select className="w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent">
              <option value="">Tous les niveaux</option>
              <option value="7">7 ème Education de base</option>
              <option value="8">8 ème Education de base</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Date de début</label>
            <input 
              type="date"
              className="w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Date de fin</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
          </div>

          <button className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors">
            Appliquer les filtres
          </button>
        </div>
      </div>
    </div>
  );
}
