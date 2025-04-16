'use client';

import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {CalendarIcon} from 'lucide-react';
import {cn} from '@/lib/utils';
import {format} from 'date-fns';
import {useState} from 'react';
import {Checkbox} from '@/components/ui/checkbox';
import {Input} from '@/components/ui/input';

const formSchema = z.object({
  projectType: z.string().min(1, {
    message: 'Please select a project type.',
  }),
  spaces: z.array(z.string()).optional(),
  otherSpace: z.string().optional(),
  squareFootage: z.string().optional(),
  timeline: z.date().optional(),
  budget: z.string().optional(),
  investmentPriorities: z.string().optional(),
  loveAboutSpace: z.string().optional(),
  dislikeAboutSpace: z.string().optional(),
  whoUsesSpace: z.string().optional(),
  primaryActivities: z.array(z.string()).optional(),
  otherActivity: z.string().optional(),
  functionalNeeds: z.string().optional(),
  designStyles: z.array(z.string()).optional(),
  otherStyle: z.string().optional(),
  idealSpace: z.string().optional(),
  colorPalette: z.string().optional(),
  colorsToAvoid: z.string().optional(),
  woodTypes: z.string().optional(),
  metalFinishes: z.string().optional(),
  fabrics: z.string().optional(),
  otherMaterials: z.string().optional(),
  itemsToKeep: z.string().optional(),
  furnitureToAdd: z.string().optional(),
  furnitureToRemove: z.string().optional(),
  architecturalFeatures: z.string().optional(),
  otherDetails: z.string().optional(),
});

export default function IntakeQuestionnaire() {
  const router = useRouter();
  const [date, setDate] = useState<Date>();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectType: '',
      spaces: [],
      squareFootage: '',
      timeline: undefined,
      budget: '',
      investmentPriorities: '',
      loveAboutSpace: '',
      dislikeAboutSpace: '',
      whoUsesSpace: '',
      primaryActivities: [],
      functionalNeeds: '',
      designStyles: [],
      idealSpace: '',
      colorPalette: '',
      colorsToAvoid: '',
      itemsToKeep: '',
      furnitureToAdd: '',
      furnitureToRemove: '',
      architecturalFeatures: '',
      otherDetails: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    const searchParams = new URLSearchParams(
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : value,
        ])
      )
    );
    router.push(`/moodboards?${searchParams.toString()}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-2/3 space-y-6"
      >
        <FormField
          control={form.control}
          name="projectType"
          render={({field}) => (
            <FormItem>
              <FormLabel>Project Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type"/>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="New construction">New construction</SelectItem>
                  <SelectItem value="Renovation">Renovation</SelectItem>
                  <SelectItem value="Room redesign">Room redesign</SelectItem>
                  <SelectItem value="Room refresh (furniture, paint, etc.)">Room refresh (furniture, paint, etc.)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="spaces"
          render={({field}) => (
            <FormItem>
              <FormLabel>Which space(s) need design help?</FormLabel>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="livingRoom"
                    checked={field.value?.includes('Living room')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Living room']
                          : field.value?.filter((v) => v !== 'Living room')
                      );
                    }}
                  />
                  <label
                    htmlFor="livingRoom"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Living room
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diningRoom"
                    checked={field.value?.includes('Dining room')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Dining room']
                          : field.value?.filter((v) => v !== 'Dining room')
                      );
                    }}
                  />
                  <label
                    htmlFor="diningRoom"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Dining room
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="kitchen"
                    checked={field.value?.includes('Kitchen')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Kitchen']
                          : field.value?.filter((v) => v !== 'Kitchen')
                      );
                    }}
                  />
                  <label
                    htmlFor="kitchen"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Kitchen
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bedroom"
                    checked={field.value?.includes('Bedroom')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Bedroom']
                          : field.value?.filter((v) => v !== 'Bedroom')
                      );
                    }}
                  />
                  <label
                    htmlFor="bedroom"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Bedroom
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bathroom"
                    checked={field.value?.includes('Bathroom')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Bathroom']
                          : field.value?.filter((v) => v !== 'Bathroom')
                      );
                    }}
                  />
                  <label
                    htmlFor="bathroom"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Bathroom
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homeOffice"
                    checked={field.value?.includes('Home office')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Home office']
                          : field.value?.filter((v) => v !== 'Home office')
                      );
                    }}
                  />
                  <label
                    htmlFor="homeOffice"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Home office
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="otherSpace"
                    placeholder="Other space"
                    {...field}
                  />
                </div>
              </div>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="squareFootage"
          render={({field}) => (
            <FormItem>
              <FormLabel>Approximate square footage</FormLabel>
              <FormControl>
                <Input placeholder="Enter square footage" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeline"
          render={({field}) => (
            <FormItem>
              <FormLabel>Timeline (desired completion date)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      {date ? (
                        format(date, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" sideOffset={3}>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budget"
          render={({field}) => (
            <FormItem>
              <FormLabel>Total budget</FormLabel>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="under10k"
                    checked={field.value === 'Under $10k'}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? 'Under $10k' : undefined);
                    }}
                  />
                  <label
                    htmlFor="under10k"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Under $10k
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="10k-30k"
                    checked={field.value === '$10k–$30k'}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? '$10k–$30k' : undefined);
                    }}
                  />
                  <label
                    htmlFor="10k-30k"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    $10k–$30k
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="30k-75k"
                    checked={field.value === '$30k–$75k'}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? '$30k–$75k' : undefined);
                    }}
                  />
                  <label
                    htmlFor="30k-75k"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    $30k–$75k
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="75k+"
                    checked={field.value === '$75k+'}
                    onCheckedChange={(checked) => {
                      field.onChange(checked ? '$75k+' : undefined);
                    }}
                  />
                  <label
                    htmlFor="75k+"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    $75k+
                  </label>
                </div>
              </div>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="investmentPriorities"
          render={({field}) => (
            <FormItem>
              <FormLabel>Investment priorities (where do you want to focus spending?)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter investment priorities" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="loveAboutSpace"
          render={({field}) => (
            <FormItem>
              <FormLabel>What do you love about your current space?</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe what you love" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dislikeAboutSpace"
          render={({field}) => (
            <FormItem>
              <FormLabel>What do you dislike about your current space?</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe what you dislike" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="whoUsesSpace"
          render={({field}) => (
            <FormItem>
              <FormLabel>Who uses this space? (adults, children, pets)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter who uses the space" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryActivities"
          render={({field}) => (
            <FormItem>
              <FormLabel>Primary activities in this space</FormLabel>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="entertaining"
                    checked={field.value?.includes('Entertaining')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Entertaining']
                          : field.value?.filter((v) => v !== 'Entertaining')
                      );
                    }}
                  />
                  <label
                    htmlFor="entertaining"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Entertaining
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="relaxation"
                    checked={field.value?.includes('Relaxation')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Relaxation']
                          : field.value?.filter((v) => v !== 'Relaxation')
                      );
                    }}
                  />
                  <label
                    htmlFor="relaxation"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Relaxation
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="working"
                    checked={field.value?.includes('Working')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Working']
                          : field.value?.filter((v) => v !== 'Working')
                      );
                    }}
                  />
                  <label
                    htmlFor="working"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Working
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cookingDining"
                    checked={field.value?.includes('Cooking/Dining')}
                    onCheckedChange={(checked) => {
                      field.onChange(
                        checked
                          ? [...(field.value || []), 'Cooking/Dining']
                          : field.value?.filter((v) => v !== 'Cooking/Dining')
                      );
                    }}
                  />
                  <label
                    htmlFor="cookingDining"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Cooking/Dining
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="otherActivity"
                    placeholder="Other activity"
                    {...field}
                  />
                </div>
              </div>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="functionalNeeds"
          render={({field}) => (
            <FormItem>
              <FormLabel>Specific functional needs (storage, lighting, etc.)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter functional needs" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="designStyles"
          render={({field}) => (
            <FormItem>
              <FormLabel>Preferred design style (select up to 3)</FormLabel>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="modern"
                    checked={field.value?.includes('Modern')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Modern']
                        : field.value?.filter((v) => v !== 'Modern');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="modern"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Modern
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="minimalist"
                    checked={field.value?.includes('Minimalist')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Minimalist']
                        : field.value?.filter((v) => v !== 'Minimalist');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="minimalist"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Minimalist
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="traditional"
                    checked={field.value?.includes('Traditional')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Traditional']
                        : field.value?.filter((v) => v !== 'Traditional');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="traditional"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Traditional
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="midCentury"
                    checked={field.value?.includes('Mid-century')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Mid-century']
                        : field.value?.filter((v) => v !== 'Mid-century');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="midCentury"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mid-century
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="industrial"
                    checked={field.value?.includes('Industrial')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Industrial']
                        : field.value?.filter((v) => v !== 'Industrial');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="industrial"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Industrial
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bohemian"
                    checked={field.value?.includes('Bohemian')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Bohemian']
                        : field.value?.filter((v) => v !== 'Bohemian');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="bohemian"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Bohemian
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="farmhouse"
                    checked={field.value?.includes('Farmhouse')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Farmhouse']
                        : field.value?.filter((v) => v !== 'Farmhouse');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="farmhouse"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Farmhouse
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scandinavian"
                    checked={field.value?.includes('Scandinavian')}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), 'Scandinavian']
                        : field.value?.filter((v) => v !== 'Scandinavian');
                      if (newValue.length <= 3) {
                        field.onChange(newValue);
                      }
                    }}
                  />
                  <label
                    htmlFor="scandinavian"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Scandinavian
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="otherStyle"
                    placeholder="Other style"
                    {...field}
                  />
                </div>
              </div>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="idealSpace"
          render={({field}) => (
            <FormItem>
              <FormLabel>Describe your ideal space in 3-5 words</FormLabel>
              <FormControl>
                <Input placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colorPalette"
          render={({field}) => (
            <FormItem>
              <FormLabel>Preferred color palette</FormLabel>
              <FormControl>
                <Input placeholder="Enter color palette" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colorsToAvoid"
          render={({field}) => (
            <FormItem>
              <FormLabel>Colors to avoid</FormLabel>
              <FormControl>
                <Input placeholder="Enter colors to avoid" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="woodTypes"
          render={({field}) => (
            <FormItem>
              <FormLabel>Wood types</FormLabel>
              <FormControl>
                <Input placeholder="Enter wood types" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="metalFinishes"
          render={({field}) => (
            <FormItem>
              <FormLabel>Metal finishes</FormLabel>
              <FormControl>
                <Input placeholder="Enter metal finishes" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fabrics"
          render={({field}) => (
            <FormItem>
              <FormLabel>Fabrics</FormLabel>
              <FormControl>
                <Input placeholder="Enter fabrics" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="otherMaterials"
          render={({field}) => (
            <FormItem>
              <FormLabel>Other materials/textures</FormLabel>
              <FormControl>
                <Input placeholder="Enter other materials" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="itemsToKeep"
          render={({field}) => (
            <FormItem>
              <FormLabel>Items you plan to keep (furniture, art, etc.)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter items to keep" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="furnitureToAdd"
          render={({field}) => (
            <FormItem>
              <FormLabel>Specific furniture pieces you want to add</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter furniture to add" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="furnitureToRemove"
          render={({field}) => (
            <FormItem>
              <FormLabel>Specific furniture pieces you want to remove</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter furniture to remove" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="architecturalFeatures"
          render={({field}) => (
            <FormItem>
              <FormLabel>Architectural features to work with or around</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter architectural features" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="otherDetails"
          render={({field}) => (
            <FormItem>
              <FormLabel>Any other details that would help inform your design suggestions</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter any other details" {...field} />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
