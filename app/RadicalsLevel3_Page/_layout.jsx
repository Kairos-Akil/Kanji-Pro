import RadicalsLevel3 from './radicalsLevel3'

import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const RadicalsLevel3Layout = () => (
    <TopSlider
        tabs={[
            buildTab('radicalsLevel3', RadicalsLevel3, 'radicals_level3'),
        ]}
    />
)

export default RadicalsLevel3Layout
