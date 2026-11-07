import TopSlider from '../../components/TopSlider'
import { buildTab } from '../../constants/Courses'

const RadicalsVariantsLayout = () => (
    <TopSlider
        tabs={[
            buildTab('radicalsVariants', 'radicals_variants'),
        ]}
    />
)

export default RadicalsVariantsLayout
