'use client'
import { useState } from 'react'

const sections = {
    Overview: [
        ['Year',                       v => v.year],
        ['Mileage',                    v => v.mileage != null ? `${v.mileage.toLocaleString()} miles` : null],
        ['Body Type',                  v => v.bodyType],
        ['Transmission',               v => v.transmission],
        ['Colour',                     v => v.colour],
        ['Seats',                      v => v.seats],
        ['Doors',                      v => v.doors],
        ['Luggage Capacity (seats up)',v => v.luggageCapacity != null ? `${v.luggageCapacity} litres` : null],
    ],
    Performance: [
        ['Fuel Type',              v => v.fuelType],
        ['Engine Power',           v => v.enginePower != null ? `${v.enginePower} bhp` : null],
        ['Engine Size',            v => v.engineSize != null ? `${v.engineSize} cc` : null],
        ['Brochure Engine Size',   v => v.brochureEngineSize != null ? `${v.brochureEngineSize} L` : null],
        ['Top Speed',              v => v.topSpeed != null ? `${v.topSpeed} mph` : null],
        ['Acceleration (0-62mph)', v => v.acceleration != null ? `${v.acceleration} seconds` : null],
    ],
    'Running Costs': [
        ['Fuel Consumption', v => v.fuelConsumption != null ? `${v.fuelConsumption} mpg` : null],
        ['Fuel Capacity',    v => v.fuelCapacity != null ? `${v.fuelCapacity} litres` : null],
        ['Urban Mpg',        v => v.urbanMpg != null ? `${v.urbanMpg} mpg` : null],
        ['Extra Urban Mpg',  v => v.extraUrbanMpg != null ? `${v.extraUrbanMpg} mpg` : null],
        ['Insurance Group',  v => v.insuranceGroup],
        ['CO2 Emissions',    v => v.co2Emissions != null ? `${v.co2Emissions} g/km` : null],
        ['Euro Emissions',   v => v.euroEmissions],
    ],
}

const VehicleSpecs = ({ vehicle }) => {
    const [active, setActive] = useState('Overview')
    const rows = sections[active]
        .map(([label, get]) => [label, get(vehicle)])
        .filter(([, value]) => value != null && value !== '')

    return (
        <section>
            <div className='flex border-b border-slate-200 mb-4'>
                {Object.keys(sections).map((tab) => (
                    <button
                        key={tab}
                        type='button'
                        onClick={() => setActive(tab)}
                        className={`${
                            tab === active
                                ? 'text-slate-900 border-b-2 border-emerald-500 -mb-px font-semibold'
                                : 'text-slate-500 hover:text-slate-700'
                        } px-4 py-2.5 text-sm font-medium transition`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-10 text-sm'>
                {rows.map(([label, value]) => (
                    <div key={label} className='flex justify-between gap-4 border-b border-slate-100 py-2.5'>
                        <dt className='text-slate-500'>{label}</dt>
                        <dd className='text-slate-900 font-semibold text-right'>{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    )
}

export default VehicleSpecs
